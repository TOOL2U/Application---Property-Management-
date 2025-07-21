/**
 * Field Operations AI Service
 * AI-powered assistant for staff field operations and job completion
 */

import { openaiService, OpenAIResponse } from './openaiService';
import { Job } from '@/types/job';
import { aiLoggingService } from './aiLoggingService';

interface FieldOpsContext {
  job: Job;
  staffRole: string;
  staffId?: string;
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
  checklist?: AIChecklistItem[];
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

export interface AIChecklistItem {
  id: string;
  task: string;
  description?: string;
  isCompleted: boolean;
  isRequired: boolean;
  estimatedMinutes?: number;
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
   * Get comprehensive job completion guidance with optional checklist
   */
  async getJobCompletionGuidance(context: FieldOpsContext, generateChecklist: boolean = false): Promise<FieldOpsResponse> {
    const startTime = Date.now();
    
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
        const parsedResponse = this.parseJobGuidanceResponse(response.data);
        
        // Generate detailed checklist if requested
        if (generateChecklist && context.staffId) {
          const checklist = await this.generateDetailedChecklist(context);
          parsedResponse.checklist = checklist;
        }

        // Log the interaction
        if (context.staffId) {
          const responseTime = Date.now() - startTime;
          await aiLoggingService.logAIInteraction({
            jobId: context.job.id,
            staffId: context.staffId,
            question: `Job completion guidance for ${context.job.title}`,
            response: JSON.stringify(parsedResponse),
            aiFunction: 'guidance',
            location: context.location,
            responseTime,
          });
        }

        return parsedResponse;
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
   * Generate a detailed, actionable checklist for a job
   */
  async generateDetailedChecklist(context: FieldOpsContext): Promise<AIChecklistItem[]> {
    try {
      // Enhanced FOA prompt for checklist generation
      const propertyName = context.job.location?.address || 'the property';
      const taskType = context.job.type;
      
      // Use the existing maintenance suggestions service with enhanced prompt
      const response = await openaiService.generateMaintenanceSuggestions({
        type: this.mapJobTypeToMaintenanceType(context.job.type),
        description: `Generate a step-by-step task checklist for ${taskType} job at ${propertyName}. 
        
        Task Details: ${context.job.description}
        
        Requirements:
        - Include safety checks and material preparation steps
        - Specify required vs optional tasks
        - Provide realistic time estimates for each step
        - Focus on quality standards and guest satisfaction
        - Include documentation/photo requirements
        - Add completion verification steps
        
        Format each step clearly with specific actions.`,
        urgency: context.job.priority as 'low' | 'medium' | 'high' | 'emergency',
        location: propertyName
      });
      
      if (response.success && response.data) {
        // Create checklist from response data
        const steps = response.data.split('\n').filter(line => line.trim().length > 0);
        
        return steps.map((step, index) => {
          const isRequired = step.toLowerCase().includes('required') || 
                           step.toLowerCase().includes('must') || 
                           index < 3; // First 3 steps are usually required
          
          const estimatedMinutes = this.estimateTaskTime(step, context.job.type);
          
          return {
            id: `task-${Date.now()}-${index}`,
            task: step.replace(/^\d+\.?\s*/, '').trim(), // Remove numbering
            description: this.getTaskDescription(step, context.job.type),
            isCompleted: false,
            isRequired,
            estimatedMinutes,
          };
        });
      }

      // Fallback checklist
      return this.createFallbackChecklist(context);
    } catch (error) {
      console.error('❌ Error generating detailed checklist:', error);
      return this.createFallbackChecklist(context);
    }
  }

  /**
   * Create a fallback checklist when AI generation fails
   */
  private createFallbackChecklist(context: FieldOpsContext): AIChecklistItem[] {
    return [
      {
        id: `prep-${Date.now()}`,
        task: 'Review job requirements and gather tools',
        description: 'Ensure you have all necessary equipment and understand the scope',
        isCompleted: false,
        isRequired: true,
        estimatedMinutes: 5,
      },
      {
        id: `main-${Date.now()}`,
        task: `Complete ${context.job.type} work`,
        description: context.job.description,
        isCompleted: false,
        isRequired: true,
        estimatedMinutes: context.job.estimatedDuration || 30,
      },
      {
        id: `quality-${Date.now()}`,
        task: 'Perform quality check and cleanup',
        description: 'Verify work meets standards and clean up work area',
        isCompleted: false,
        isRequired: true,
        estimatedMinutes: 10,
      },
    ];
  }

  /**
   * Estimate time for a task based on its description and job type
   */
  private estimateTaskTime(taskDescription: string, jobType: string): number {
    const lowerTask = taskDescription.toLowerCase();
    
    // Base time by job type
    const baseTime = {
      'maintenance': 15,
      'cleaning': 10,
      'inspection': 5,
      'plumbing': 20,
      'electrical': 25,
      'hvac': 30,
    }[jobType] || 10;

    // Adjust based on task complexity indicators
    if (lowerTask.includes('inspect') || lowerTask.includes('check')) return 5;
    if (lowerTask.includes('clean') || lowerTask.includes('wipe')) return 8;
    if (lowerTask.includes('repair') || lowerTask.includes('fix')) return baseTime * 2;
    if (lowerTask.includes('install') || lowerTask.includes('replace')) return baseTime * 3;
    if (lowerTask.includes('test') || lowerTask.includes('verify')) return 5;
    
    return baseTime;
  }

  /**
   * Get a description for a task based on the task name and job type
   */
  private getTaskDescription(taskName: string, jobType: string): string {
    const lowerTask = taskName.toLowerCase();
    
    if (lowerTask.includes('safety') || lowerTask.includes('ppe')) {
      return 'Safety is paramount - ensure proper protective equipment is used';
    }
    if (lowerTask.includes('photo') || lowerTask.includes('document')) {
      return 'Take clear photos for documentation and quality assurance';
    }
    if (lowerTask.includes('clean') && jobType === 'maintenance') {
      return 'Clean the work area before and after completing the task';
    }
    
    return '';
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

    const systemMessage = `You are the FOA (Field Operations Assistant) AI helping staff complete tasks safely and effectively. 

Core Behavior Guidelines:
- Answer clearly and concisely while being thorough
- Always prioritize safety and company rules
- Provide practical, actionable advice for the current job
- Be helpful, professional, and supportive
- If staff asks about delays or policy questions, remind them of proper procedures
- Focus on quality standards and guest satisfaction
- Suggest checking with supervisors for policy clarifications when needed

Remember: You're helping field staff succeed in their work while maintaining high standards.`;

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
      checklist: undefined, // Will be handled separately for AI checklist items
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
