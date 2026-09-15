import theshy from '../assets/following/theshy-selected.webp';
import ronaldo from '../assets/following/ronaldo-selected.webp';
import alcaraz from '../assets/following/alcaraz-selected.webp';
import sinner from '../assets/following/sinner-selected.webp';
import theshyMask from '../assets/following/theshy-mask.svg?url&no-inline';
import ronaldoMask from '../assets/following/ronaldo-mask.svg?url&no-inline';
import alcarazMask from '../assets/following/alcaraz-mask.svg?url&no-inline';
import sinnerMask from '../assets/following/sinner-mask.svg?url&no-inline';

// User-selected originals are documented in assets/following/selected-images.json.
// No photographer or license was supplied: do not carry over the previous photos' credits.
export const following = [
  {
    id: 'theshy', name: 'TheShy', fullName: 'THESHY', sport: '英雄联盟', image: theshy, mask: theshyMask,
    alt: 'TheShy 身穿黑色上衣、面对镜头的半身肖像',
  },
  {
    id: 'ronaldo', name: 'C 罗', fullName: 'CRISTIANO RONALDO', sport: '足球', image: ronaldo, mask: ronaldoMask,
    alt: 'C 罗身穿葡萄牙国家队红色七号球衣，握拳庆祝',
  },
  {
    id: 'alcaraz', name: '阿卡', fullName: 'CARLOS ALCARAZ', sport: '网球', image: alcaraz, mask: alcarazMask,
    alt: '阿尔卡拉斯身穿橙粉色无袖球衣，握拳望向场边',
  },
  {
    id: 'sinner', name: '辛纳', fullName: 'JANNIK SINNER', sport: '网球', image: sinner, mask: sinnerMask,
    alt: '辛纳身穿白色球衣、戴白色帽子，在草地上跨步俯身救球',
  },
];
