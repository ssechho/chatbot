const profileImages = {
  intellectual: {
    boy: [
      "/images/profile_intellectual/boy_0.png",
      "/images/profile_intellectual/boy_1.png",
      "/images/profile_intellectual/boy_2.png",
      "/images/profile_intellectual/boy_3.png",
      "/images/profile_intellectual/boy_4.png",
      "/images/profile_intellectual/boy_5.png",
      "/images/profile_intellectual/boy_6.png",
      // ... other boy images
    ],
    girl: [
      "/images/profile_intellectual/girl_0.png",
      "/images/profile_intellectual/girl_1.png",
      "/images/profile_intellectual/girl_2.png",
      "/images/profile_intellectual/girl_3.png",
      "/images/profile_intellectual/girl_4.png",
      "/images/profile_intellectual/girl_5.png",
      "/images/profile_intellectual/girl_6.png",
      // ... other girl images
    ],
  },
  funny: {
    boy: [
      "/images/profile_funny/boy_0.png",
      "/images/profile_funny/boy_1.png",
      "/images/profile_funny/boy_2.png",
      "/images/profile_funny/boy_3.png",
      "/images/profile_funny/boy_4.png",
      "/images/profile_funny/boy_5.png",
      "/images/profile_funny/boy_6.png",
      // ... other boy images
    ],
    girl: [
      "/images/profile_funny/girl_0.png",
      "/images/profile_funny/girl_1.png",
      "/images/profile_funny/girl_2.png",
      "/images/profile_funny/girl_3.png",
      "/images/profile_funny/girl_4.png",
      "/images/profile_funny/girl_5.png",
      "/images/profile_funny/girl_6.png",
      // ... other girl images
    ],
  },
  intellectual_default: {
    boy: "/images/profile_intellectual/boy_default.png",
    girl: "/images/profile_intellectual/girl_default.png",
  },
  funny_default: {
    boy: "/images/profile_funny/boy_default.png",
    girl: "/images/profile_funny/girl_default.png",
  },
};

export const getProfileImage = (index, gender, mode) => {
  if (index === 0) {
    return profileImages[`${mode}_default`][gender];
  }
  const profileOptions = profileImages[mode][gender];
  return profileOptions[(index - 1) % profileOptions.length];
};
