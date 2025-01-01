export const ROLE = {
  SUPER_ADMIN: 'SUPER ADMIN',
  ADMIN: 'ADMIN',
  DIRECTOR: 'DIRECTOR',
  MANAGER: 'MANAGER',
  INTERVIEWER: 'INTERVIEWER',
  REVIEWER_FAMILY: 'REVIEWER FAMILY',
  REVIEWER_ESSAY: 'REVIEWER ESSAY',
  REVIEWER_BONUS_POINT: 'REVIEWER BONUS POINT',
};

export const ROLE_DATA = [
  {
    name: ROLE.SUPER_ADMIN,
    description: 'Quản trị viên cấp cao',
  },
  {
    name: ROLE.ADMIN,
    description: 'Quản trị viên',
  },
  {
    name: ROLE.DIRECTOR,
    description: 'Giám đốc',
  },
  {
    name: ROLE.MANAGER,
    description: 'Quản lý',
  },
  {
    name: ROLE.INTERVIEWER,
    description: 'Tình nguyện viên phỏng vấn',
  },
  {
    name: ROLE.REVIEWER_FAMILY,
    description: 'Tình nguyện viên đánh giá hồ sơ gia đình',
  },
  {
    name: ROLE.REVIEWER_ESSAY,
    description: 'Tình nguyện viên đánh giá bài luận',
  },
  {
    name: ROLE.REVIEWER_BONUS_POINT,
    description: 'Tình nguyện viên đánh giá điểm cộng',
  },
];
