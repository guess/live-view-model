export const parseTopicWithParams = (
  topicPattern: string,
  params?: Record<string, unknown>
): string => {
  if (!params) return topicPattern;

  return topicPattern.replace(/{(\w+)}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      throw new Error(
        `Missing required parameter '${key}' for topic pattern '${topicPattern}'`
      );
    }
    return String(params[key]);
  });
};
