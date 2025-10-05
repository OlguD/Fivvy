namespace Fivvy.Api.Exceptions;

public class ForbiddenProjectAccessException : Exception
{
    public ForbiddenProjectAccessException() : base("You do not have access to this project.")
    {
    }

    public ForbiddenProjectAccessException(string message) : base(message)
    {
    }

    public ForbiddenProjectAccessException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
