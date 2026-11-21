const sign = /^(?:[A-Z]|ILY|HELLO|YES|NO|THANKYOU)$/;
const choices = {
  reason: ["loved", "self", "curious", "work", "other"],
  who: ["partner", "child", "parent", "sibling", "relative", "friend"],
  level: ["none", "few", "alphabet", "conversation"],
  goal: ["5", "10", "15", "20"],
  source: ["tiktok", "instagram", "youtube", "search", "friend", "deaf-community", "other"],
};
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const signs = (value, limit) => Array.isArray(value) && value.length <= limit
  && value.every((item) => typeof item === "string" && sign.test(item));

function validLesson(value) {
  return record(value) && signs(value.queue, 500)
    && integer(value.pos, 0, value.queue.length)
    && integer(value.tries, 1, 10000)
    && typeof value.hinted === "boolean"
    && (value.missedAt === null || value.missedAt === value.pos)
    && signs(value.missed, 30)
    && record(value.stars)
    && Object.entries(value.stars).every(([id, count]) => sign.test(id) && integer(count, 0, 3))
    && typeof value.completed === "boolean";
}

export function validState(state) {
  if (!record(state) || !record(state.profile) || !record(state.progress)) return false;
  const { profile, progress } = state;
  return Object.entries(profile).every(([key, value]) => Object.hasOwn(choices, key) && choices[key].includes(value))
    && typeof progress.name === "string" && progress.name.length <= 80
    && (progress.active === 1 || progress.active === 2)
    && record(progress.lessons)
    && validLesson(progress.lessons[1]) && validLesson(progress.lessons[2]);
}
