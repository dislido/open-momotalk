/** 业务异常,正常的业务流程 */
export default class BizError extends Error {
  constructor(message: string, public code?: number, options?: ErrorOptions) {
    super(message, options);
  }
}
