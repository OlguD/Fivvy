

using Fivvy.Api.Helpers;
using Fivvy.Api.Models;
using Fivvy.Api.Models.RequestModels;
using Fivvy.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/project")]
public class ProjectController : ControllerBase
{
    private readonly IProjectRepository _projectRepository;

    public ProjectController(IProjectRepository projectRepository)
    {
        _projectRepository = projectRepository;
    }


    [HttpGet("all-projects")]
    [Authorize]
    public async Task<IActionResult> GetAllProjects()
    {
        try
        {
            var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Token not found");
            }
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader.Substring(7)
                : authHeader;

            var projects = await _projectRepository.GetAllProjectsAsync(token);
            return Ok(projects);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("add-project")]
    [Authorize]
    // TODO AddProjectRequestModel'i entegre et. Burada sorun var. 
    public async Task<IActionResult> AddProject([FromBody] AddProjectRequestModel request)
    {
        try
        {
            var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Token not found");
            }

            // Bearer prefix'i varsa kaldır, yoksa token'ı olduğu gibi kullan
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader.Substring(7) // "Bearer " 7 karakter
                : authHeader;

            var newProjectModel = new ProjectModel
            {
                ProjectName = request.ProjectName,
                Description = request.Description,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                ClientId = request.ClientId
            };

            if (await _projectRepository.AddProjectAsync(newProjectModel, token))
            {
                return Ok();
            }
            else
            {
                return BadRequest();
            }
        }
        catch
        {
            return BadRequest();
        }
    }


    [HttpPut("update-project")]
    [Authorize]
    public async Task<IActionResult> UpdateProject([FromBody] ProjectUpdateRequestModel request)
    {
        try
        {
            var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Token not found");
            }

            // Bearer prefix'i varsa kaldır, yoksa token'ı olduğu gibi kullan
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader.Substring(7) // "Bearer " 7 karakter
                : authHeader;

            var updateProject = new ProjectModel
            {
                ProjectName = request.ProjectName,
                Description = request.Description,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                ClientId = request.ClientId
            };

            if (await _projectRepository.UpdateProjectAsync(request.ProjectId, token, updateProject))
            {
                return Ok();
            }
            else
            {
                return BadRequest();
            }
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }


    [HttpDelete("remove-project")]
    [Authorize]
    public async Task<IActionResult> RemoveProject(RemoveProjectRequestModel request)
    {
        try
        {

            var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Token not found");
            }

            // Bearer prefix'i varsa kaldır, yoksa token'ı olduğu gibi kullan
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader.Substring(7) // "Bearer " 7 karakter
                : authHeader;

            if (await _projectRepository.DeleteProjectAsync(request.ProjectId, token))
            {
                return Ok();
            }
            else
            {
                return BadRequest();
            }
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}