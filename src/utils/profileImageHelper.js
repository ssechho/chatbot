const profileImages = {
  intellectual: [
    "/images/profile_intellectual/boy_0.png",
    "/images/profile_intellectual/boy_1.png",
    "/images/profile_intellectual/boy_2.png",
    "/images/profile_intellectual/boy_3.png",
    "/images/profile_intellectual/boy_4.png",
    "/images/profile_intellectual/boy_5.png",
    "/images/profile_intellectual/boy_6.png",
    "/images/profile_intellectual/girl_0.png",
    "/images/profile_intellectual/girl_1.png",
    "/images/profile_intellectual/girl_2.png",
    "/images/profile_intellectual/girl_3.png",
    "/images/profile_intellectual/girl_4.png",
    "/images/profile_intellectual/girl_5.png",
    "/images/profile_intellectual/girl_6.png",
  ],
  funny: [
    "/images/profile_funny/boy_0.png",
    "/images/profile_funny/boy_1.png",
    "/images/profile_funny/boy_2.png",
    "/images/profile_funny/boy_3.png",
    "/images/profile_funny/boy_4.png",
    "/images/profile_funny/boy_5.png",
    "/images/profile_funny/boy_6.png",
    "/images/profile_funny/girl_0.png",
    "/images/profile_funny/girl_1.png",
    "/images/profile_funny/girl_2.png",
    "/images/profile_funny/girl_3.png",
    "/images/profile_funny/girl_4.png",
    "/images/profile_funny/girl_5.png",
    "/images/profile_funny/girl_6.png",
  ],
  boy_default: "/images/profile_intellectual/boy_default.png",
  girl_default: "/images/profile_intellectual/girl_default.png",
};

export const getProfileImage = (index, defaultProfile, mode) => {
  if (index === 0) {
    return profileImages[defaultProfile];
  }
  const prefix = defaultProfile.split("_")[0];
  const profileOptions =
    mode === "intellectual" ? profileImages.intellectual : profileImages.funny;
  return profileOptions[(index - 1) % profileOptions.length];
};
