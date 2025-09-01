type AvatarApi = {
  avatarUrl?: string;
};

export function mapAvatarFromApi(data: AvatarApi): string | null {
  return data.avatarUrl ?? null;
}
