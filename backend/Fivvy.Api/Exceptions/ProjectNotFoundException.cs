

namespace Fivvy.Api.Exceptions;

public class ProjectNotFoundException : Exception
{
    public ProjectNotFoundException() : base("Project not found"){}
    public ProjectNotFoundException(string message, Exception innerException) : base(message, innerException){}
}
