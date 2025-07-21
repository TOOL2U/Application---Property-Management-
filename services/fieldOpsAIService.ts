/**
 * Field Operations AI Service
 * AI-powered assistant for staff field operations and job completion
 */

import { openaiService, OpenAIResponse } from './openaiService';
import { Job } from '@/types/job';

interface FieldOpsContext {
  job: Job;
  staffRole: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  weatherConditions?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface FieldOpsResponse extends OpenAIResponse {
  suggestions?: string[];
  checklist?: string[];
  warnings?: string[];
  estimatedTime?: string;
  nextSteps?: string[];
}

interface JobCompletionGuidance {
  preJobChecklist: string[];
  duringJobTips: string[];
  photoGuidance: string[];
  qualityChecks: string[];
  completionSteps: string[];
}

class FieldOpsAIService {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  }

  isConfigured(): boolean {
    return openaiService.isConfigured();
  }

  /**
   * Get comprehensive job completion guidance
   */
  async getJobCompletionGuidance(context: FieldOpsContext): Promise<FieldOpsResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'AI service not configured. Please check OpenAI API settings.',
      };
    }

    const systemMessage = `You are an expert field operations assistant for luxury property management. You provide practical, actionable guidance for staff completing maintenance, cleaning, and inspection tasks. Focus on quality standards, safety, and guest satisfaction.`;

    const prompt = this.buildJobGuidancePrompt(context);

    try {
      const response = await openaiService.generateMaintenanceSuggestions({
        type: this.mapJobTypeToMaintenanceType(context.job.type),
        description: context.job.description,
        urgency: context.job.priority as 'low' | 'medium' | 'high' | 'emergency',
        location: context.job.location.address || 'Property location'
      });

      if (response.success && response.data) {
        return this.parseJobGuidanceResponse(response.data);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get job guidance'
      };
    }
  }

  /**
   * Answer specific questions about the current job
   */
  async askJobQuestion(question: string, context: FieldOpsContext): Promise<FieldOpsResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'AI service not configured',
      };
    }

    const systemMessage = `You are a field operations expert assistant. Answer questions about the current job with practical, actionable advice. Be concise but thorough.`;

    const contextPrompt = `
Current Job Context:
- Job Type: ${context.job.type}
- Title: ${context.job.title}
- Description: ${context.job.description}
- Priority: ${context.job.priority}
- Location: ${context.job.location.address}
- Staff Role: ${context.staffRole}
- Status: ${context.job.status}
${context.weatherConditions ? `- Weather: ${context.weatherConditions}` : ''}
${context.timeOfDay ? `- Time of Day: ${context.timeOfDay}` : ''}

Staff Question: "${question}"

Provide a helpful, practical answer specific to this job context.`;

    try {
      const response = await this.callOpenAI(contextPrompt, systemMessage);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process question'
      };
    }
  }

  /**
   * Get photo guidance for documenting work
   */
  async getPhotoGuidance(context: FieldOpsContext): Promise<FieldOpsResponse> {
    const systemMessage = `You are a documentation expert for property management. Provide specific photo guidance for documenting work quality and completion.`;

    const prompt = `
Job Details:
- Type: ${context.job.type}
- Description: ${context.job.description}
- Location: ${context.job.location.address}

Provide specific photo guidance including:
1. What photos to take before starting
2. During work progress shots
3. Final completion documentation
4. Quality verification angles
5. Any safety or compliance documentation needed

Format as a clear, actionable list.`;

    return this.callOpenAI(prompt, systemMessage);
  }

  /**
   * Get safety recommendations for the job
   */
  async getSafetyRecommendations(context: FieldOpsContext): Promise<FieldOpsResponse> {
    const systemMessage = `You are a safety expert for property maintenance and cleaning operations. Provide specific safety guidance and precautions.`;

    const prompt = `
Job Safety Assessment:
- Job Type: ${context.job.type}
- Description: ${context.job.description}
- Location: ${context.job.location.address}
- Staff Role: ${context.staffRole}
${context.weatherConditions ? `- Weather Conditions: ${context.weatherConditions}` : ''}

Provide:
1. Safety precautions specific to this job type
2. Required safety equipment/PPE
3. Environmental hazards to watch for
4. Emergency procedures if applicable
5. Guest safety considerations

Be specific and practical.`;

    return this.callOpenAI(prompt, systemMessage);
  }

  /**
   * Get time estimation and scheduling advice
   */
  async getTimeEstimation(context: FieldOpsContext): Promise<FieldOpsResponse> {
    const systemMessage = `You are a field operations efficiency expert. Provide realistic time estimates and scheduling advice for property management tasks.`;

    const prompt = `
Job Planning:
- Job Type: ${context.job.type}
- Description: ${context.job.description}
- Estimated Duration: ${context.job.estimatedDuration || 'Not specified'} minutes
- Priority: ${context.job.priority}
- Staff Role: ${context.staffRole}

Provide:
1. Realistic time estimate breakdown
2. Factors that might affect timing
3. Suggestions for efficient completion
4. When to schedule this type of work
5. Buffer time recommendations

Be practical and consider real-world variables.`;

    return this.callOpenAI(prompt, systemMessage);
  }

  /**
   * Private helper methods
   */
  private buildJobGuidancePrompt(context: FieldOpsContext): string {
    return `
Field Operations Job Analysis:

Job Details:
- Type: ${context.job.type}
- Title: ${context.job.title}
- Description: ${context.job.description}
- Priority: ${context.job.priority}
- Status: ${context.job.status}
- Estimated Duration: ${context.job.estimatedDuration || 'Not specified'} minutes
- Location: ${context.job.location.address}

Staff Context:
- Role: ${context.staffRole}
- Current Location: ${context.location?.address || 'On-site'}
${context.weatherConditions ? `- Weather: ${context.weatherConditions}` : ''}
${context.timeOfDay ? `- Time of Day: ${context.timeOfDay}` : ''}

Provide comprehensive guidance including:
1. Pre-job preparation checklist
2. Step-by-step completion guidance
3. Quality standards to maintain
4. Photo documentation requirements
5. Safety considerations
6. Common challenges and solutions
7. Final inspection points

Format as clear, actionable sections.`;
  }

  private mapJobTypeToMaintenanceType(jobType: string): 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'other' {
    const typeMap: { [key: string]: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'other' } = {
      'plumbing': 'plumbing',
      'electrical': 'electrical',
      'hvac': 'hvac',
      'appliance': 'appliance',
      'maintenance': 'other',
      'cleaning': 'other',
      'inspection': 'other',
      'landscaping': 'other',
      'security': 'other'
    };

    return typeMap[jobType.toLowerCase()] || 'other';
  }

  private parseJobGuidanceResponse(response: string): FieldOpsResponse {
    // Parse the response to extract structured data
    const suggestions: string[] = [];
    const checklist: string[] = [];
    const warnings: string[] = [];
    const nextSteps: string[] = [];

    // Simple parsing - could be enhanced with more sophisticated NLP
    const lines = response.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentSection = '';
    for (const line of lines) {
      if (line.toLowerCase().includes('checklist') || line.toLowerCase().includes('preparation')) {
        currentSection = 'checklist';
        continue;
      }
      if (line.toLowerCase().includes('warning') || line.toLowerCase().includes('safety') || line.toLowerCase().includes('caution')) {
        currentSection = 'warnings';
        continue;
      }
      if (line.toLowerCase().includes('next') || line.toLowerCase().includes('steps') || line.toLowerCase().includes('completion')) {
        currentSection = 'nextSteps';
        continue;
      }

      if (line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./)) {
        const cleanLine = line.replace(/^[•\-\d\.]\s*/, '');
        switch (currentSection) {
          case 'checklist':
            checklist.push(cleanLine);
            break;
          case 'warnings':
            warnings.push(cleanLine);
            break;
          case 'nextSteps':
            nextSteps.push(cleanLine);
            break;
          default:
            suggestions.push(cleanLine);
        }
      }
    }

    return {
      success: true,
      data: response,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      checklist: checklist.length > 0 ? checklist : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      nextSteps: nextSteps.length > 0 ? nextSteps : undefined,
    };
  }

  private async callOpenAI(prompt: string, systemMessage?: string): Promise<FieldOpsResponse> {
    try {
      // Use the existing openaiService for consistency
      const response = await openaiService.generateMaintenanceSuggestions({
        type: 'other',
        description: prompt,
        urgency: 'medium',
        location: 'Field location'
      });

      return {
        success: response.success,
        data: response.data,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI service error'
      };
    }
  }
}

// Export singleton instance
export const fieldOpsAIService = new FieldOpsAIService();
export default fieldOpsAIService;

// Export types
export type {
  FieldOpsContext,
  FieldOpsResponse,
  JobCompletionGuidance
};
