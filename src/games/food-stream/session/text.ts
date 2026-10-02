/**
 * Toàn bộ chữ hiển thị của Food Stream (tiếng Anh — giao diện trong game chỉ dùng tiếng Anh).
 */
export const TEXT = {
  titleTop: 'PHONICS',
  titleBottom: 'FOOD STREAM',
  play: 'PLAY',
  guide: 'GUIDE',
  allGames: 'ALL GAMES',
  back: 'BACK',
  setup: 'GO LIVE SETUP',
  mode: 'MODE',
  solo: 'SOLO',
  soloSub: '1 player',
  classroom: 'CLASSROOM',
  classroomSub: 'Team A vs Team B',
  streamer: 'STREAMER',
  wordPack: 'WORD PACK',
  level: 'LEVEL',
  teams: 'TEAMS',
  questionsPerTeam: 'QUESTIONS PER TEAM',
  steal: 'STEAL',
  stealOn: 'ON',
  stealOff: 'OFF',
  stealSub: 'Other team can answer',
  answerTimer: 'ANSWER TIMER',
  noTimer: 'OFF',
  seconds: 'sec',
  goLive: 'GO LIVE!',
  getReady: 'GET READY!',
  go: 'GO!',
  whoGoesFirst: 'WHO GOES FIRST?',
  yourTurn: 'YOUR TURN!',
  steals: 'STEAL!',
  timesUp: "TIME'S UP!",
  paused: 'PAUSED',
  resume: 'RESUME',
  quit: 'QUIT',
  quitQuestion: 'END THIS LIVE?',
  cancel: 'CANCEL',
  liveComplete: 'LIVE COMPLETE!',
  teamWins: 'WINS!',
  tie: "IT'S A TIE!",
  greatTeamwork: 'GREAT TEAMWORK!',
  wordsLearned: 'WORDS LEARNED',
  score: 'SCORE',
  correct: 'CORRECT',
  viewers: 'VIEWERS',
  hearts: 'HEARTS',
  bestStreak: 'BEST STREAK',
  newBest: 'NEW BEST!',
  perfect: 'PERFECT!',
  playAgain: 'PLAY AGAIN',
  nextLevel: 'NEXT LEVEL',
  changeSetup: 'SETUP',
  totalViewers: 'TOTAL VIEWERS',
  combo: 'COMBO',
} as const;

/** Bình luận "khán giả" (plan §12): chỉ chọn từ danh sách có sẵn, không có chat thật */
export const COMMENTS = {
  correct: [
    'Great sound!',
    'Yummy word!',
    'Amazing!',
    'So good!',
    'Nice!',
    'I love it!',
    "You're a phonics star!",
  ],
  wrong: ['Try again!', 'So close!', 'You can do it!', 'Almost!'],
  hello: ["Let's go!", 'Hi streamer!', 'Hungry!', 'Yay, live!'],
} as const;

/** Bình luận hô vang âm vừa học, vd "D! D! D!" */
export const chantComment = (letter: string): string => {
  const upper = letter.toUpperCase();
  return `${upper}! ${upper}! ${upper}!`;
};
