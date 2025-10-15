using Fivvy.Api.Data;
using Fivvy.Api.Exceptions;
using Fivvy.Api.Models;
using Fivvy.Api.Repositories.Invoice;
using Microsoft.EntityFrameworkCore;

namespace Fivvy.Api.Repositories;

public class ProjectRepository : IProjectRepository
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly IInvoiceRepository _invoiceRepository;

    public ProjectRepository(AppDbContext context, IUserRepository userRepository, IInvoiceRepository invoiceRepository)
    {
        _context = context;
        _userRepository = userRepository;
        _invoiceRepository = invoiceRepository;
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

            if (!ownsClient) throw new ForbiddenProjectAccessException();

            if (string.IsNullOrWhiteSpace(projectModel.ProjectName) ||
                string.IsNullOrWhiteSpace(projectModel.Description))
            {
                throw new Exception("Project name and description are required");
            }

            if (projectModel.StartDate > projectModel.EndDate)
            {
                throw new Exception("Project's start date cannot be greater than end date");
            }

            var newProject = new ProjectModel
            {
                ProjectName = projectModel.ProjectName,
                Description = projectModel.Description,
                StartDate = projectModel.StartDate,
                EndDate = projectModel.EndDate,
                ClientId = projectModel.ClientId,
                ProjectPrice = projectModel.ProjectPrice
            };

            _context.Projects.Add(newProject);
            await _context.SaveChangesAsync();


            var invoice = new InvoiceModel
            {
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMddHHmmss}",
                ClientId = projectModel.ClientId,
                InvoiceDate = projectModel.StartDate,
                DueDate = projectModel.EndDate ?? newProject.StartDate.AddDays(30),
                Status = InvoiceStatus.Draft,
                SubTotal = (decimal)newProject.ProjectPrice,
                Tax = 0,
                Total = (decimal)newProject.ProjectPrice,
                Notes = $"Project: {newProject.Description}",
                LineItems = new List<InvoiceLineItemModel>
                {
                    new InvoiceLineItemModel
                    {
                        Description = newProject.Description,
                        Quantity = 1,
                        UnitPrice = (decimal)newProject.ProjectPrice
                    }
                }
            };

            await _invoiceRepository.CreateInvoiceAsync(token, invoice);
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

            if (!ownsProject) throw new ForbiddenProjectAccessException();

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

            if (!ownsProject) throw new ForbiddenProjectAccessException();

            project.ProjectName = projectModel.ProjectName;
            project.Description = projectModel.Description;
            project.StartDate = projectModel.StartDate;
            project.EndDate = projectModel.EndDate;
            project.ProjectPrice = projectModel.ProjectPrice;

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            throw new Exception($"An error occured while updating project: {ex.Message}");
        }
    }
}