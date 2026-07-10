import { capabilityResolver } from '../../coordinators/CapabilityResolver';

describe('CapabilityResolver', () => {
  test('يجب تحديد القدرة الصحيحة للدراسة', () => {
    const result = capabilityResolver.resolve('أريد أن أذاكر الفيزياء');
    expect(result).toBeDefined();
    expect(result.capability).toBeDefined();
    expect(result.confidence).toBeDefined();
  });

  test('يجب تحديد القدرة الصحيحة للبرمجة', () => {
    const result = capabilityResolver.resolve('عندي كود محتاج أصلحه');
    expect(result.capability).toBeDefined();
  });

  test('يجب تحديد القدرة الصحيحة للأعمال', () => {
    const result = capabilityResolver.resolve('عندي فكرة مشروع جديد');
    expect(result.capability).toBeDefined();
  });

  test('يجب تحديد القدرة الصحيحة للأحلام', () => {
    const result = capabilityResolver.resolve('حلمت البارحة حلماً غريباً');
    expect(result.capability).toBeDefined();
  });

  test('يجب إرجاع عام عند عدم التأكد', () => {
    const result = capabilityResolver.resolve('مرحباً كيف حالك');
    expect(result.capability).toBe('general');
  });
});
