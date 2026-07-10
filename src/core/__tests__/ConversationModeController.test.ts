import { ConversationModeController } from '../ConversationModeController';

describe('ConversationModeController', () => {
  let controller: ConversationModeController;

  beforeEach(() => {
    controller = new ConversationModeController();
  });

  test('يجب أن يبدأ في وضع Silent', () => {
    expect(controller.getMode()).toBe('silent');
  });

  test('يجب التبديل إلى وضع Voice', () => {
    controller.setMode('voice');
    expect(controller.getMode()).toBe('voice');
    expect(controller.isVoiceEnabled()).toBe(true);
    expect(controller.isSTTEnabled()).toBe(true);
  });

  test('يجب التبديل إلى وضع Living', () => {
    controller.setMode('living');
    expect(controller.getMode()).toBe('living');
    expect(controller.isVoiceEnabled()).toBe(true);
  });

  test('يجب التبديل إلى وضع Silent', () => {
    controller.setMode('voice');
    controller.setMode('silent');
    expect(controller.getMode()).toBe('silent');
    expect(controller.isVoiceEnabled()).toBe(false);
  });
});
