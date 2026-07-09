import { memoryEngine } from '../../engine/memory/MemoryEngine';

interface Goal {
  id: string;
  title: string;
  type: 'learning' | 'project' | 'habit' | 'wellbeing';
  progress: number;
  created: string;
  lastMentioned: string;
}

export class GoalCoordinator {
  private goals: Goal[] = [];

  async detectGoalsFromMemories(): Promise<void> {
    const longTerm = memoryEngine.getLongTermMemories(6);
    const keywords = ['أريد أن', 'هدف', 'أخطط', 'نفسي', 'learn', 'goal', 'plan'];

    for (const memory of longTerm) {
      const hasGoalKeyword = keywords.some(kw => memory.content.toLowerCase().includes(kw.toLowerCase()));
      if (hasGoalKeyword && !this.goals.find(g => g.title === memory.content.substring(0, 50))) {
        this.addGoal({
          title: memory.content.substring(0, 80),
          type: this.detectGoalType(memory.content),
        });
      }
    }
  }

  addGoal(goal: { title: string; type: Goal['type'] }): Goal {
    const newGoal: Goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: goal.title,
      type: goal.type,
      progress: 0,
      created: new Date().toISOString(),
      lastMentioned: new Date().toISOString(),
    };
    this.goals.push(newGoal);
    return newGoal;
  }

  getActiveGoals(): Goal[] {
    return this.goals.filter(g => g.progress < 100);
  }

  updateProgress(goalId: string, progress: number): void {
    const goal = this.goals.find(g => g.id === goalId);
    if (goal) {
      goal.progress = Math.min(100, Math.max(0, progress));
      goal.lastMentioned = new Date().toISOString();
    }
  }

  private detectGoalType(text: string): Goal['type'] {
    const lower = text.toLowerCase();
    if (lower.includes('تعلم') || lower.includes('ادرس') || lower.includes('learn')) return 'learning';
    if (lower.includes('مشروع') || lower.includes('project') || lower.includes('أبني')) return 'project';
    if (lower.includes('عادة') || lower.includes('habit') || lower.includes('نوم') || lower.includes('رياضة')) return 'habit';
    return 'wellbeing';
  }
}

export const goalCoordinator = new GoalCoordinator();
