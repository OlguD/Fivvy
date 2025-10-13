
using Fivvy.Api.Models;
namespace Fivvy.Api.Repositories;


public interface IProjectRepository
{
    Task<bool> AddProjectAsync(ProjectModel projectModel, string token);
    Task<bool> DeleteProjectAsync(int projectId, string token);
    Task<bool> UpdateProjectAsync(int projectId, string token, ProjectModel projectModel);
    Task<List<ProjectModel>> GetAllProjectsAsync(string token);
}