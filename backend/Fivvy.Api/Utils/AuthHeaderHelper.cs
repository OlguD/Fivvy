

namespace Fivvy.Api.Utils;

public class AuthHeaderHelper
{
    public static bool TryGetBearerToken(HttpContext httpContext, out string token)
    {
        token = string.Empty;

        if (httpContext == null)
        {
            return false;
        }

        var authHeader = httpContext.Request.Headers["Authorization"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(authHeader))
        {
            return false;
        }

        token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authHeader.Substring("Bearer ".Length)
            : authHeader;

        return !string.IsNullOrWhiteSpace(token);
    }
}