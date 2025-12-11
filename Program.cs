using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

// static files from wwwroot
app.UseStaticFiles();

app.MapGet("/", async context =>
{
    await context.Response.SendFileAsync("wwwroot/html/example.html");
});


app.Run();
