/**
 * Runtime Demo — State Transition Log
 * Run: npx ts-node src/core/__tests__/runtime-demo.ts
 * 
 * Proves the Runtime works by logging state transitions.
 */

import { TwinRuntime } from '../TwinRuntime';
import { StateBus } from '../StateBus';
import { EventBus } from '../EventBus';

async function runDemo() {
  console.log('\n═══════════════════════════════════════');
  console.log('  TWIN RUNTIME — DEMO');
  console.log('═══════════════════════════════════════\n');

  // Subscribe to all state changes
  StateBus.subscribe((state, prevState) => {
    if (state.presenceLevel !== prevState.presenceLevel) {
      console.log(`  🔄 Presence: ${prevState.presenceLevel} → ${state.presenceLevel}`);
    }
    if (state.interfaceState !== prevState.interfaceState) {
      console.log(`  🔄 State:    ${prevState.interfaceState} → ${state.interfaceState}`);
    }
  });

  // Subscribe to events
  const events: string[] = [];
  const eventNames: Array<keyof import('../EventBus').EventPayloads> = [
    'APP_FOREGROUND', 'APP_BACKGROUND', 'PRESENCE_CHANGED'
  ];
  eventNames.forEach(name => {
    EventBus.on(name, (payload: any) => {
      events.push(`${name}: ${JSON.stringify(payload)}`);
    });
  });

  // Create runtime
  const runtime = new TwinRuntime({ autoStart: false, enableDebugLogging: true });

  console.log('📦 Runtime created.\n');

  // Start
  console.log('▶️  Starting...');
  await runtime.start();
  console.log('   Status:', runtime.getStatus());
  console.log('   Presence:', StateBus.select(s => s.presenceLevel));
  console.log('   Interface:', StateBus.select(s => s.interfaceState));
  console.log('   Uptime:', runtime.getUptime(), 'ms\n');

  // Transition through states
  const transitions = [2, 3, 4, 5, 2, 1, 0];
  for (const level of transitions) {
    await new Promise(resolve => setTimeout(resolve, 300));
    runtime.setPresence(level as any, 'demo');
  }

  console.log('\n📊 Events emitted:');
  events.forEach(e => console.log(`   ${e}`));

  console.log('\n✅ Demo complete. Runtime is alive.\n');
  
  runtime.stop();
}

runDemo().catch(console.error);
