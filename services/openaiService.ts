/**
 * OpenAI Service for Villa Property Management
 * AI-powered features for property descriptions, maintenance, and guest communication
 */

// OpenAI Configuration from environment variables
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_ORG_ID = process.env.EXPO_PUBLIC_OPENAI_ORG_ID;
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_MAX_TOKENS = parseInt(process.env.EXPO_PUBLIC_OPENAI_MAX_TOKENS || '1000');
const OPENAI_TEMPERATURE = parseFloat(process.env.EXPO_PUBLIC_OPENAI_TEMPERATURE || '0.7');

// Feature flags
const AI_FEATURES = {
  propertyDescriptions: process.env.EXPO_PUBLIC_AI_PROPERTY_DESCRIPTIONS === 'true',
  maintenanceSuggestions: process.env.EXPO_PUBLIC_AI_MAINTENANCE_SUGGESTIONS === 'true',
  guestCommunication: process.env.EXPO_PUBLIC_AI_GUEST_COMMUNICATION === 'true',
  pricingOptimization: process.env.EXPO_PUBLIC_AI_PRICING_OPTIMIZATION === 'true',
};

interface OpenAIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

interface PropertyData {
  name: string;
  type: 'villa' | 'apartment' | 'house' | 'condo';
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  location: string;
  size?: number;
  features?: string[];
}

interface MaintenanceIssue {
  type: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'other';
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  location: string;
}

interface GuestMessage {
  guestName: string;
  propertyName: string;
  messageType: 'inquiry' | 'complaint' | 'request' | 'compliment';
  originalMessage: string;
  context?: string;
}

class OpenAIService {
  private apiKey: string | undefined;
  private orgId: string | undefined;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
    this.orgId = OPENAI_ORG_ID;
  }

  // Check if OpenAI is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Generic OpenAI API call
  private async callOpenAI(prompt: string, systemMessage?: string): Promise<OpenAIResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env.local file.',
      };
    }

    try {
      const messages = [
        ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
        { role: 'user', content: prompt },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.orgId && { 'OpenAI-Organization': this.orgId }),
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages,
          max_tokens: OPENAI_MAX_TOKENS,
          temperature: OPENAI_TEMPERATURE,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: `OpenAI API error: ${errorData.error?.message || response.statusText}`,
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          error: 'No response content from OpenAI',
        };
      }

      return {
        success: true,
        data: content.trim(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Generate property description
  async generatePropertyDescription(property: PropertyData): Promise<OpenAIResponse> {
    if (!AI_FEATURES.propertyDescriptions) {
      return {
        success: false,
        error: 'Property description AI feature is disabled',
      };
    }

    const systemMessage = `You are a luxury property marketing expert specializing in villa and vacation rental descriptions. Create compelling, professional property descriptions that highlight unique features and appeal to high-end travelers.`;

    const prompt = `Create a compelling property description for this luxury ${property.type}:

Property Details:
- Name: ${property.name}
- Type: ${property.type}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Location: ${property.location}
${property.size ? `- Size: ${property.size} sq ft` : ''}

Amenities: ${property.amenities.join(', ')}
${property.features ? `Special Features: ${property.features.join(', ')}` : ''}

Write a 150-200 word description that:
1. Highlights the luxury and unique aspects
2. Appeals to discerning travelers
3. Mentions key amenities naturally
4. Creates an aspirational tone
5. Includes the location appeal

Format as a single paragraph without bullet points.`;

    return this.callOpenAI(prompt, systemMessage);
  }

  // Generate maintenance suggestions
  async generateMaintenanceSuggestions(issue: MaintenanceIssue): Promise<OpenAIResponse> {
    if (!AI_FEATURES.maintenanceSuggestions) {
      return {
        success: false,
        error: 'Maintenance suggestions AI feature is disabled',
      };
    }

    const systemMessage = `You are a property maintenance expert with extensive experience in luxury villa and vacation rental maintenance. Provide practical, actionable maintenance advice.`;

    const prompt = `Analyze this maintenance issue and provide recommendations:

Issue Type: ${issue.type}
Description: ${issue.description}
Urgency Level: ${issue.urgency}
Location: ${issue.location}

Please provide:
1. Immediate action steps (if urgent)
2. Recommended solution approach
3. Estimated timeline for resolution
4. Preventive measures for the future
5. Whether professional help is needed

Keep the response practical and actionable for property management staff.`;

    return this.callOpenAI(prompt, systemMessage);
  }

  // Generate guest communication response
  async generateGuestResponse(message: GuestMessage): Promise<OpenAIResponse> {
    if (!AI_FEATURES.guestCommunication) {
      return {
        success: false,
        error: 'Guest communication AI feature is disabled',
      };
    }

    const systemMessage = `You are a professional guest relations specialist for luxury villa rentals. Respond with empathy, professionalism, and a solution-oriented approach. Maintain a warm but professional tone.`;

    const prompt = `Generate a professional response to this guest message:

Guest: ${message.guestName}
Property: ${message.propertyName}
Message Type: ${message.messageType}
${message.context ? `Context: ${message.context}` : ''}

Guest Message:
"${message.originalMessage}"

Create a response that:
1. Acknowledges their message appropriately
2. Shows empathy and understanding
3. Provides a clear solution or next steps
4. Maintains professional luxury service standards
5. Ends with an appropriate call to action

Keep the tone warm but professional, suitable for luxury hospitality.`;

    return this.callOpenAI(prompt, systemMessage);
  }

  // Generate pricing optimization suggestions
  async generatePricingOptimization(propertyData: {
    propertyName: string;
    currentRate: number;
    occupancyRate: number;
    seasonality: 'peak' | 'shoulder' | 'off-season';
    localEvents?: string[];
    competitorRates?: number[];
  }): Promise<OpenAIResponse> {
    if (!AI_FEATURES.pricingOptimization) {
      return {
        success: false,
        error: 'Pricing optimization AI feature is disabled',
      };
    }

    const systemMessage = `You are a vacation rental revenue management expert specializing in luxury properties. Provide data-driven pricing recommendations that maximize revenue while maintaining occupancy.`;

    const prompt = `Analyze this property's pricing strategy and provide optimization recommendations:

Property: ${propertyData.propertyName}
Current Nightly Rate: $${propertyData.currentRate}
Current Occupancy Rate: ${propertyData.occupancyRate}%
Season: ${propertyData.seasonality}
${propertyData.localEvents ? `Upcoming Events: ${propertyData.localEvents.join(', ')}` : ''}
${propertyData.competitorRates ? `Competitor Rates: $${propertyData.competitorRates.join(', $')}` : ''}

Provide recommendations for:
1. Optimal pricing strategy for the current season
2. Dynamic pricing adjustments based on demand
3. Special event pricing opportunities
4. Long-term booking incentives
5. Revenue optimization tactics

Include specific rate recommendations and reasoning.`;

    return this.callOpenAI(prompt, systemMessage);
  }

  // Generate smart task suggestions based on property type and season
  async generateTaskSuggestions(propertyType: string, season: string, lastMaintenanceDate?: string): Promise<OpenAIResponse> {
    const systemMessage = `You are a property management expert specializing in preventive maintenance and guest experience optimization for luxury vacation rentals.`;

    const prompt = `Generate a prioritized maintenance and preparation task list for a luxury ${propertyType}:

Season: ${season}
${lastMaintenanceDate ? `Last Major Maintenance: ${lastMaintenanceDate}` : ''}

Create a task list that includes:
1. Seasonal maintenance priorities
2. Guest experience enhancements
3. Preventive maintenance items
4. Safety and compliance checks
5. Aesthetic improvements

Format as a numbered list with brief descriptions and estimated time for each task.`;

    return this.callOpenAI(prompt, systemMessage);
  }

  // Generate staff performance audit analysis
  async generateStaffAuditAnalysis(auditData: {
    staffName: string;
    performanceData: any[];
    metrics: any;
  }): Promise<OpenAIResponse> {
    const systemMessage = `You are a professional workplace auditor analyzing staff performance data. Provide constructive, fair, and actionable feedback based on quantitative performance metrics. Focus on reliability, quality of work, punctuality, and areas for improvement.`;

    const prompt = `Please analyze the following staff member's weekly performance data and provide a comprehensive audit report.

Staff Member: ${auditData.staffName}
Week Summary:
- Total Jobs: ${auditData.performanceData.length}
- Completed: ${auditData.metrics.completedJobs}
- Declined: ${auditData.metrics.declinedJobs}
- Late Completions: ${auditData.metrics.lateJobs}
- On-time Completions: ${auditData.metrics.completedOnTime}
- Missing Proof/Photos: ${auditData.metrics.missingProof}
- Average Completion Time: ${auditData.metrics.averageCompletionTime.toFixed(1)} hours
- Time Efficiency: ${auditData.metrics.estimatedVsActualTime.toFixed(0)}%

Detailed Job Data:
${auditData.performanceData.map((job: any) => 
  `Job ${job.jobId}: ${job.jobType} at ${job.propertyAddress} - Status: ${job.status}, Photos: ${job.photos}, Duration: ${job.actualDuration?.toFixed(1) || 'N/A'}h`
).join('\n')}

Please provide a JSON response with:
1. A trust score (1-100) based on reliability, punctuality, and consistency
2. A quality score (1-100) based on job completion quality and proof provided
3. A brief professional comment (2-3 sentences) summarizing overall performance
4. 2-3 specific recommendations for improvement
5. Any flagged issues that require management attention

Respond in JSON format:
{
  "trustScore": number,
  "qualityScore": number,
  "comment": "string",
  "recommendations": ["string1", "string2"],
  "flaggedIssues": ["string1", "string2"]
}`;

    return this.callOpenAI(prompt, systemMessage);
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
export default openaiService;

// Export types for use in components
export type {
  OpenAIResponse,
  PropertyData,
  MaintenanceIssue,
  GuestMessage,
};
