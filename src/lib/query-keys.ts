export const queryKeys = {
  staff: {
    all: ['staff'] as const,
    detail: (id: string) => ['staff', id] as const,
  },
  store: {
    current: ['current-store'] as const,
  },
  shifts: {
    all: ['shifts'] as const,
    active: (staffId: string) => ['active-shift', staffId] as const,
  },
  profile: {
    me: ['my-profile'] as const,
  },
} as const;
