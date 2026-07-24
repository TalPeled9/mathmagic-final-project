import type { Gender } from '@mathmagic/types';
import defaultAvatarBoy from '@/assets/default_avatar.png';
import defaultAvatarGirl from '@/assets/default_avatar_girl.png';

export function getDefaultAvatar(gender: Gender | undefined): string {
  return gender === 'girl' ? defaultAvatarGirl : defaultAvatarBoy;
}
