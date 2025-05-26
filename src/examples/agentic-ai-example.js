// Simple example of Agentic AI and Context Protocol

class TaskAgent {
    constructor() {
        this.context = {
            tasks: [],
            currentUser: null,
            lastAction: null
        };
    }

    // Understanding and maintaining context
    updateContext(newInfo) {
        this.context = { ...this.context, ...newInfo };
        console.log('Context updated:', this.context);
    }

    // Planning and decision making
    planAction(userRequest) {
        const action = this.analyzeRequest(userRequest);
        this.context.lastAction = action;
        return action;
    }

    // Understanding user requests
    analyzeRequest(request) {
        if (request.includes('add task')) {
            return 'ADD_TASK';
        } else if (request.includes('list tasks')) {
            return 'LIST_TASKS';
        } else if (request.includes('complete task')) {
            return 'COMPLETE_TASK';
        }
        return 'UNKNOWN';
    }

    // Executing actions
    executeAction(action, params = {}) {
        switch (action) {
            case 'ADD_TASK':
                this.context.tasks.push(params.task);
                return `Added task: ${params.task}`;
            case 'LIST_TASKS':
                return `Current tasks: ${this.context.tasks.join(', ')}`;
            case 'COMPLETE_TASK':
                const index = this.context.tasks.indexOf(params.task);
                if (index > -1) {
                    this.context.tasks.splice(index, 1);
                    return `Completed task: ${params.task}`;
                }
                return `Task not found: ${params.task}`;
            default:
                return 'Unknown action';
        }
    }
}

// Example usage
const agent = new TaskAgent();

// Simulating a conversation
console.log('=== Starting Agentic AI Example ===');

// User: "I want to add a task"
agent.updateContext({ currentUser: 'John' });
const action1 = agent.planAction('add task');
console.log(agent.executeAction(action1, { task: 'Buy groceries' }));

// User: "What are my tasks?"
const action2 = agent.planAction('list tasks');
console.log(agent.executeAction(action2));

// User: "Complete the grocery task"
const action3 = agent.planAction('complete task');
console.log(agent.executeAction(action3, { task: 'Buy groceries' }));

// Check final state
console.log('=== Final Context ===');
console.log(agent.context); 