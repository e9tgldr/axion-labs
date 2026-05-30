import type { Lang } from '@/i18n'

export const GRADES = [6, 7, 8, 9, 10, 11] as const
export type Grade = (typeof GRADES)[number]

/**
 * Topic lists per grade, per language. Kept here (not in locale JSON) so the
 * key-parity test stays focused on UI copy. Each grade has the same number of
 * topics across languages.
 */
export const CURRICULUM: Record<Grade, Record<Lang, string[]>> = {
  6: {
    en: ['Measurement & units', 'Density', 'Forces', 'Simple machines', 'Pressure'],
    mn: ['Хэмжилт ба нэгж', 'Нягт', 'Хүч', 'Энгийн машин', 'Даралт'],
    zh: ['测量与单位', '密度', '力', '简单机械', '压强'],
  },
  7: {
    en: ['Motion & speed', 'Mass & weight', 'Buoyancy', 'Work & energy', 'Heat'],
    mn: ['Хөдөлгөөн ба хурд', 'Масс ба жин', 'Архимедийн хүч', 'Ажил ба энерги', 'Дулаан'],
    zh: ['运动与速度', '质量与重量', '浮力', '功与能', '热'],
  },
  8: {
    en: ['Heat transfer', 'Electric charge', 'Ohm’s law', 'Magnetism', 'Reflection of light'],
    mn: ['Дулаан дамжуулалт', 'Цахилгаан цэнэг', 'Омын хууль', 'Соронзон', 'Гэрлийн ойлт'],
    zh: ['热传递', '电荷', '欧姆定律', '磁', '光的反射'],
  },
  9: {
    en: ['Kinematics', 'Newton’s laws', 'Momentum', 'Work–energy theorem', 'Projectile motion'],
    mn: ['Кинематик', 'Ньютоны хуулиуд', 'Импульс', 'Ажил–энергийн теорем', 'Шидэлтийн хөдөлгөөн'],
    zh: ['运动学', '牛顿定律', '动量', '功能定理', '抛体运动'],
  },
  10: {
    en: ['Circular motion', 'Oscillations & waves', 'Lens optics', 'Gas laws', 'Thermodynamics'],
    mn: ['Тойрог хөдөлгөөн', 'Хэлбэлзэл ба долгион', 'Линзний оптик', 'Хийн хууль', 'Термодинамик'],
    zh: ['圆周运动', '振动与波', '透镜光学', '气体定律', '热力学'],
  },
  11: {
    en: ['Electromagnetism', 'Capacitors & circuits', 'Atomic physics', 'Nuclear physics', 'Quantum basics'],
    mn: ['Цахилгаан соронзон', 'Конденсатор ба хэлхээ', 'Атомын физик', 'Цөмийн физик', 'Квант үндэс'],
    zh: ['电磁学', '电容与电路', '原子物理', '核物理', '量子基础'],
  },
}
