export function isTokenExpiredResponse(err) {
  const r = err?.response;

  const httpStatus = r?.status;
  const statusCodeInBody = r?.data?.statusCode; // bạn nói backend có statusCode

  if (httpStatus === 401) return true;
  if (statusCodeInBody === 401) return true;

  return false;
}
