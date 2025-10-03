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

            var userProjects = await _context.Projects
                .Include(p => p.Client)
                .ThenInclude(c => c != null ? c.User : null)
                .Where(p => p.Client != null && p.Client.User != null && p.Client.User.Id == userId)
                .ToListAsync();

            return userProjects;
        }
        catch (Exception ex)
        {
            throw new Exception($"Error getting projects: {ex.Message}");
        }
    }

    public async Task<bool> AddProjectAsync(ProjectModel projectModel, string token, int clientId)
    {
        try
        {
            var userId = _userRepository.ExtractUserIdFromToken(token);
            var existingUser = _context.Users
                .FirstOrDefault(u => u.Id == userId);

            if (existingUser != null)
            {
                var existingClient = existingUser.Clients.FirstOrDefault(c => c.Id == clientId);
                if (existingClient != null)
                {
                    if (!string.IsNullOrEmpty(projectModel.ProjectName) &&
                        !string.IsNullOrEmpty(projectModel.Description))
                    {
                        var newProject = new ProjectModel
                        {
                            ProjectName = projectModel.ProjectName,
                            Description = projectModel.Description,
                            StartDate = projectModel.StartDate,
                            EndDate = projectModel.EndDate,
                            Client = existingClient
                        };

                        _context.Projects.Add(newProject);
                        await _context.SaveChangesAsync();
                        return true;
                    }
                    else
                    {
                        throw new Exception("Project name and description are required");
                    }
                }
                else
                {
                    throw new ClientNotFoundException();
                }
            }
            throw new UserNotFoundException();
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
            var existingProject = await _context.Projects
                .Include(p => p.Client)
                .ThenInclude(c => c!= null ? c.User : null)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (existingProject != null && existingProject.Client?.User?.Id == userId)
            {
                _context.Projects.Remove(existingProject);
                await _context.SaveChangesAsync();
                return true;
            }
            throw new ProjectNotFoundException();
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
            var existingProject = await _context.Projects
                .Include(p => p.Client)
                .ThenInclude(c => c!= null ? c.User : null)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (existingProject != null && existingProject.Client?.User?.Id == userId)
            {
                existingProject.ProjectName = projectModel.ProjectName;
                existingProject.Description = projectModel.Description;
                existingProject.StartDate = projectModel.StartDate;
                existingProject.EndDate = projectModel.EndDate;

                // Client degisikligi icin (opsiyonel)
                // existingProject.Client = projectModel.Client;

                _context.Projects.Update(existingProject);
                await _context.SaveChangesAsync();
                return true;
            }
            throw new ProjectNotFoundException();
        }
        catch (Exception ex)
        {
            throw new Exception($"An error occured while updating project: {ex.Message}");
        }
    }
}