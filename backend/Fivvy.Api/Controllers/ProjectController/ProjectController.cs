

using Fivvy.Api.Models;
using Fivvy.Api.Models.RequestModels;
using Fivvy.Api.Repositories;
using Fivvy.Api.Utils;
using Fivvy.Api.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

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
            if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
            {
                return Unauthorized("Token not found");
            }

            var projects = await _projectRepository.GetAllProjectsAsync(token);
            return Ok(projects);
        }
        catch (ForbiddenProjectAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
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
            if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
            {
                return Unauthorized("Token not found");
            }

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
        catch (ForbiddenProjectAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
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
            if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
            {
                return Unauthorized("Token not found");
            }

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
        catch (ForbiddenProjectAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
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
            if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
            {
                return Unauthorized("Token not found");
            }

            if (await _projectRepository.DeleteProjectAsync(request.ProjectId, token))
            {
                return Ok();
            }
            else
            {
                return BadRequest();
            }
        }
        catch (ForbiddenProjectAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}