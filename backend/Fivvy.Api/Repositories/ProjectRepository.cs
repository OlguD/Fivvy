using Fivvy.Api.Data;
using Fivvy.Api.Exceptions;
using Fivvy.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Fivvy.Api.Repositories;

public class ProjectRepository : IProjectRepository
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepository;

    public ProjectRepository(AppDbContext context, IUserRepository userRepository)
    {
        _context = context;
        _userRepository = userRepository;
    }


    public async Task<List<ProjectModel>> GetAllProjectsAsync(string token)
    {
        try
        {
            var userId = _userRepository.ExtractUserIdFromToken(token);

            return await _context.Projects
                .Where(p => _context.Clients.Any(c => c.Id == p.ClientId && c.UserId == userId))
                .AsNoTracking()
                .ToListAsync();

        }
        catch (Exception ex)
        {
            throw new Exception($"Error getting projects: {ex.Message}");
        }
    }

    public async Task<bool> AddProjectAsync(ProjectModel projectModel, string token)
    {
        try
        {
            var userId = _userRepository.ExtractUserIdFromToken(token);
            var ownsClient = await _context.Clients.AnyAsync(c => c.Id == projectModel.ClientId && c.UserId == userId);

            if (!ownsClient) throw new ClientNotFoundException();

            if (string.IsNullOrWhiteSpace(projectModel.ProjectName) ||
                string.IsNullOrWhiteSpace(projectModel.Description))
            {
                throw new Exception("Project name and description are required");
            }

            var newProject = new ProjectModel
            {
                ProjectName = projectModel.ProjectName,
                Description = projectModel.Description,
                StartDate = projectModel.StartDate,
                EndDate = projectModel.EndDate,
                ClientId = projectModel.ClientId
            };

            _context.Projects.Add(newProject);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }
    }


    public async Task<bool> DeleteProjectAsync(int projectId, string token)
    {
        try
        {
            var userId = _userRepository.ExtractUserIdFromToken(token);
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null) throw new ProjectNotFoundException();

            var ownsProject = await _context.Clients.AnyAsync(c => c.Id == project.ClientId && c.UserId == userId);

            if (!ownsProject) throw new ProjectNotFoundException();

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            throw new Exception($"Error deleting projects: {ex.Message}");
        }
    }

    public async Task<bool> UpdateProjectAsync(int projectId, string token, ProjectModel projectModel)
    {
        try
        {
            var userId = _userRepository.ExtractUserIdFromToken(token);
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null) throw new ProjectNotFoundException();

            var ownsProject = await _context.Clients.AnyAsync(c => c.Id == project.ClientId && c.UserId == userId);

            // TODO buralara exception olarak user not have this project exception'i eklenebilir.
            if (!ownsProject) throw new ProjectNotFoundException();

            project.ProjectName = projectModel.ProjectName;
            project.Description = projectModel.Description;
            project.StartDate = projectModel.StartDate;
            project.EndDate = projectModel.EndDate;

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            throw new Exception($"An error occured while updating project: {ex.Message}");
        }
    }
}