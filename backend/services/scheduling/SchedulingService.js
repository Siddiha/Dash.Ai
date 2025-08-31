const googleService = require('../integrations/googleService');
const openaiService = require('../ai/openaiService');
const User = require('../../models/User');
const Meeting = require('../../models/Meeting');

class SchedulingService {
  constructor() {
    this.defaultDuration = 60; // minutes
    this.workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM
    this.bufferTime = 15; // minutes between meetings
  }

  async handleSchedulingRequest(userId, metadata) {
    try {
      const { entities } = metadata;
      
      // Extract scheduling information
      const schedulingInfo = await this.parseSchedulingRequest(entities);
      
      if (schedulingInfo.requiresMoreInfo) {
        return {
          success: false,
          message: schedulingInfo.clarificationNeeded,
          suggestions: schedulingInfo.suggestions
        };
      }

      // Find available slots
      const availableSlots = await this.findOptimalSlots(userId, schedulingInfo);
      
      if (availableSlots.length === 0) {
        return {
          success: false,
          message: "I couldn't find any available time slots that match your requirements. Would you like me to suggest alternative times?",
          suggestions: await this.generateAlternativeSuggestions(userId, schedulingInfo)
        };
      }

      // If auto-schedule is enabled and we have a clear preference, book it
      if (schedulingInfo.autoSchedule && availableSlots.length > 0) {
        const bookedMeeting = await this.bookMeeting(userId, availableSlots[0], schedulingInfo);
        return {
          success: true,
          meeting: bookedMeeting,
          message: `Perfect! I've scheduled your meeting for ${this.formatDateTime(bookedMeeting.startTime)}.`
        };
      }

      // Return suggestions for user to choose
      return {
        success: true,
        availableSlots: availableSlots.slice(0, 5), // Top 5 suggestions
        message: `I found several available time slots for your meeting. Which one works best for you?`
      };

    } catch (error) {
      console.error('Scheduling request error:', error);
      return {
        success: false,
        message: "I encountered an issue while trying to schedule your meeting. Please try again.",
        error: error.message
      };
    }
  }

  async parseSchedulingRequest(entities) {
    const schedulingInfo = {
      title: entities.title || 'Meeting',
      duration: this.parseDuration(entities.duration) || this.defaultDuration,
      attendees: entities.people || [],
      preferredTimes: this.parseDateTime(entities.datetime),
      location: entities.location,
      description: entities.description,
      priority: entities.priority || 'normal',
      recurring: entities.recurring || false,
      requiresMoreInfo: false,
      autoSchedule: entities.action === 'schedule' && entities.confidence > 0.8
    };

    // Check if we need more information
    const missingInfo = [];
    
    if (!schedulingInfo.preferredTimes || schedulingInfo.preferredTimes.length === 0) {
      missingInfo.push('preferred time');
    }

    if (schedulingInfo.attendees.length === 0 && !entities.internal) {
      missingInfo.push('attendees');
    }

    if (missingInfo.length > 0) {
      schedulingInfo.requiresMoreInfo = true;
      schedulingInfo.clarificationNeeded = `I need a bit more information to schedule your meeting. Please specify: ${missingInfo.join(', ')}.`;
      schedulingInfo.suggestions = this.generateClarificationSuggestions(missingInfo);
    }

    return schedulingInfo;
  }

  async findOptimalSlots(userId, schedulingInfo) {
    try {
      // Get user's calendar availability
      const availability = await this.getUserAvailability(userId, schedulingInfo);
      
      // Get attendees' availability if applicable
      const attendeesAvailability = await this.getAttendeesAvailability(
        userId, 
        schedulingInfo.attendees
      );

      // Find overlapping free times
      const freeSlots = this.findOverlappingFreeTime(
        availability, 
        attendeesAvailability, 
        schedulingInfo.duration
      );

      // Score and rank slots based on preferences
      const rankedSlots = await this.rankTimeSlots(freeSlots, schedulingInfo);

      return rankedSlots;
    } catch (error) {
      console.error('Find optimal slots error:', error);
      throw error;
    }
  }

  async getUserAvailability(userId, schedulingInfo) {
    const startDate = schedulingInfo.preferredTimes?.[0] || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // Look ahead 2 weeks

    try {
      const calendarEvents = await googleService.getCalendarEvents(
        userId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      const busySlots = calendarEvents.map(event => ({
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        title: event.summary
      }));

      return this.generateFreeSlots(busySlots, startDate, endDate);
    } catch (error) {
      console.error('Get user availability error:', error);
      // Fallback to basic working hours if calendar access fails
      return this.generateDefaultWorkingHours(startDate, endDate);
    }
  }

  async getAttendeesAvailability(userId, attendees) {
    // This would typically integrate with external calendar systems
    // For now, we'll return default working hours for external attendees
    const availability = {};
    
    for (const attendee of attendees) {
      // Try to find if attendee is also a user in our system
      const attendeeUser = await User.findOne({ email: attendee });
      
      if (attendeeUser) {
        availability[attendee] = await this.getUserAvailability(attendeeUser._id, {});
      } else {
        // Default working hours for external attendees
        availability[attendee] = this.generateDefaultWorkingHours(
          new Date(),
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        );
      }
    }

    return availability;
  }

  findOverlappingFreeTime(userAvailability, attendeesAvailability, duration) {
    const allAvailabilities = [userAvailability, ...Object.values(attendeesAvailability)];
    
    // Find intersection of all availabilities
    let commonSlots = userAvailability;
    
    for (const availability of Object.values(attendeesAvailability)) {
      commonSlots = this.intersectAvailabilities(commonSlots, availability);
    }

    // Filter slots that are long enough for the meeting
    return commonSlots.filter(slot => {
      const slotDuration = (slot.end - slot.start) / (1000 * 60); // minutes
      return slotDuration >= duration;
    });
  }

  intersectAvailabilities(availability1, availability2) {
    const intersections = [];
    
    for (const slot1 of availability1) {
      for (const slot2 of availability2) {
        const start = new Date(Math.max(slot1.start, slot2.start));
        const end = new Date(Math.min(slot1.end, slot2.end));
        
        if (start < end) {
          intersections.push({ start, end });
        }
      }
    }

    return intersections;
  }

  async rankTimeSlots(slots, schedulingInfo) {
    const rankedSlots = slots.map(slot => ({
      ...slot,
      score: this.calculateSlotScore(slot, schedulingInfo)
    }));

    // Sort by score (highest first)
    rankedSlots.sort((a, b) => b.score - a.score);

    return rankedSlots.map(slot => ({
      start: slot.start,
      end: new Date(slot.start.getTime() + schedulingInfo.duration * 60 * 1000),
      score: slot.score,
      reasoning: this.generateSlotReasoning(slot, schedulingInfo)
    }));
  }

  calculateSlotScore(slot, schedulingInfo) {
    let score = 100; // Base score

    const hour = slot.start.getHours();
    const dayOfWeek = slot.start.getDay();

    // Prefer mid-morning and early afternoon slots
    if (hour >= 10 && hour <= 11) score += 20; // Late morning
    else if (hour >= 14 && hour <= 15) score += 15; // Early afternoon
    else if (hour >= 9 && hour <= 16) score += 10; // Working hours
    else score -= 30; // Outside preferred times

    // Avoid Mondays and Fridays for external meetings
    if (schedulingInfo.attendees.length > 0) {
      if (dayOfWeek === 1) score -= 10; // Monday
      if (dayOfWeek === 5) score -= 15; // Friday
    }

    // Prefer Tuesday, Wednesday, Thursday
    if (dayOfWeek >= 2 && dayOfWeek <= 4) score += 10;

    // Priority adjustments
    if (schedulingInfo.priority === 'high') score += 20;
    if (schedulingInfo.priority === 'low') score -= 10;

    // Prefer closer dates for urgent meetings
    const daysFromNow = (slot.start - new Date()) / (1000 * 60 * 60 * 24);
    if (schedulingInfo.priority === 'high' && daysFromNow <= 2) score += 15;

    return score;
  }

  generateSlotReasoning(slot, schedulingInfo) {
    const reasons = [];
    const hour = slot.start.getHours();
    const dayName = slot.start.toLocaleDateString('en-US', { weekday: 'long' });

    if (hour >= 10 && hour <= 11) {
      reasons.push("optimal focus time");
    }
    if (slot.start.getDay() >= 2 && slot.start.getDay() <= 4) {
      reasons.push("mid-week scheduling");
    }
    if (schedulingInfo.attendees.length > 0) {
      reasons.push("considers all attendees");
    }

    return reasons.join(", ") || "good availability";
  }

  async bookMeeting(userId, timeSlot, schedulingInfo) {
    try {
      // Create calendar event
      const eventData = {
        title: schedulingInfo.title,
        description: schedulingInfo.description,
        startTime: timeSlot.start.toISOString(),
        endTime: timeSlot.end.toISOString(),
        attendees: schedulingInfo.attendees,
        location: schedulingInfo.location,
        createMeetLink: schedulingInfo.location === 'online' || !schedulingInfo.location
      };

      const calendarEvent = await googleService.createCalendarEvent(userId, eventData);

      // Store meeting in database
      const meeting = new Meeting({
        userId,
        title: schedulingInfo.title,
        description: schedulingInfo.description,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        attendees: schedulingInfo.attendees,
        location: schedulingInfo.location,
        googleEventId: calendarEvent.id,
        meetingLink: calendarEvent.conferenceData?.entryPoints?.[0]?.uri,
        status: 'scheduled'
      });

      await meeting.save();

      // Send confirmation emails if needed
      if (schedulingInfo.attendees.length > 0) {
        await this.sendMeetingInvitations(meeting, schedulingInfo);
      }

      return meeting;
    } catch (error) {
      console.error('Book meeting error:', error);
      throw new Error('Failed to book meeting');
    }
  }

  async sendMeetingInvitations(meeting, schedulingInfo) {
    try {
      // This would integrate with email service
      console.log('Sending meeting invitations to:', schedulingInfo.attendees);
      // Implementation would go here
    } catch (error) {
      console.error('Send invitations error:', error);
    }
  }

  generateFreeSlots(busySlots, startDate, endDate) {
    const freeSlots = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Create working hours for this day
      const dayStart = new Date(currentDate);
      dayStart.setHours(this.workingHours.start, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(this.workingHours.end, 0, 0, 0);

      // Find busy slots for this day
      const dayBusySlots = busySlots
        .filter(slot => slot.start.toDateString() === currentDate.toDateString())
        .sort((a, b) => a.start - b.start);

      let currentTime = dayStart;

      for (const busySlot of dayBusySlots) {
        if (currentTime < busySlot.start) {
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(busySlot.start)
          });
        }
        currentTime = new Date(Math.max(currentTime, busySlot.end));
      }

      // Add remaining time in the day
      if (currentTime < dayEnd) {
        freeSlots.push({
          start: new Date(currentTime),
          end: new Date(dayEnd)
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return freeSlots;
  }

  generateDefaultWorkingHours(startDate, endDate) {
    const slots = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const dayStart = new Date(currentDate);
      dayStart.setHours(this.workingHours.start, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(this.workingHours.end, 0, 0, 0);

      slots.push({ start: dayStart, end: dayEnd });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  parseDuration(durationText) {
    if (!durationText) return null;

    const matches = durationText.match(/(\d+)\s*(hour|hr|minute|min)/i);
    if (matches) {
      const value = parseInt(matches[1]);
      const unit = matches[2].toLowerCase();
      
      if (unit.startsWith('hour') || unit === 'hr') {
        return value * 60; // Convert to minutes
      }
      return value;
    }

    return null;
  }

  parseDateTime(datetimeText) {
    if (!datetimeText) return null;

    // This would use a more sophisticated date parsing library
    // For now, simple implementation
    const date = new Date(datetimeText);
    return date.toString() !== 'Invalid Date' ? [date] : null;
  }

  formatDateTime(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  generateClarificationSuggestions(missingInfo) {
    const suggestions = [];
    
    if (missingInfo.includes('preferred time')) {
      suggestions.push(
        'Schedule for tomorrow at 2 PM',
        'Find time next week',
        'Book for Friday morning'
      );
    }

    if (missingInfo.includes('attendees')) {
      suggestions.push(
        'Add john@company.com to the meeting',
        'Include the marketing team',
        'Just me for now'
      );
    }

    return suggestions;
  }

  async generateAlternativeSuggestions(userId, schedulingInfo) {
    // Generate alternative suggestions when no slots are available
    const alternatives = [
      'Try extending to next week',
      'Consider a shorter meeting duration',
      'Schedule early morning or late afternoon',
      'Split into multiple shorter meetings'
    ];

    return alternatives;
  }
}

module.exports = new SchedulingService();
