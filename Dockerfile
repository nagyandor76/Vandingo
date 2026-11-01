# Builds the React frontend, publishes the ASP.NET Core app, and runs it.
# Railway builds this on deploy; the data directory (/data) is a Railway Volume. See docs/deployment.md.

FROM node:22 AS web
WORKDIR /src/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
# vite.config.ts writes the build into ../src/Vandingo.Api/wwwroot.
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api
WORKDIR /src
COPY src/Vandingo.Api/Vandingo.Api.csproj src/Vandingo.Api/
RUN dotnet restore src/Vandingo.Api/Vandingo.Api.csproj
COPY src/Vandingo.Api/ src/Vandingo.Api/
COPY Quizzes/ Quizzes/
COPY --from=web /src/src/Vandingo.Api/wwwroot/ src/Vandingo.Api/wwwroot/
RUN dotnet publish src/Vandingo.Api/Vandingo.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=api /app ./
# Railway mounts the Volume owned by root, so the app runs as root to be able to write /data.
USER root
ENV Vandingo__DataDirectory=/data
# Railway passes the port to listen on in PORT.
CMD ["sh", "-c", "ASPNETCORE_HTTP_PORTS=${PORT:-8080} exec dotnet Vandingo.Api.dll"]
