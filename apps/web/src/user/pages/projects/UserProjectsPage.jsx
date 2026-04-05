import React, { useMemo, useState } from 'react';
import { ExternalLink, Github, PencilLine, Plus, Trash2, X } from 'lucide-react';

const emptyProjectForm = {
  title: '',
  description: '',
  techStack: '',
  liveUrl: '',
  githubUrl: '',
};

const normalizeProjects = (projects) => {
  if (!Array.isArray(projects)) {
    return [];
  }

  return projects
    .map((project, index) => {
      if (!project || typeof project !== 'object') {
        return null;
      }

      const title = String(project.title || '').trim();
      const description = String(project.description || '').trim();
      const techStack = String(project.techStack || '').trim();
      const liveUrl = String(project.liveUrl || '').trim();
      const githubUrl = String(project.githubUrl || '').trim();

      if (!title) {
        return null;
      }

      return {
        id: String(project.id || `project-${Date.now()}-${index}`),
        title,
        description,
        techStack,
        liveUrl,
        githubUrl,
        createdAt: project.createdAt || new Date().toISOString(),
      };
    })
    .filter(Boolean);
};

const isLikelyUrl = (value) => !value || /^https?:\/\/.+/i.test(value);

export default function UserProjectsPage({ userType, user, onUpdateUser }) {
  const projects = useMemo(() => normalizeProjects(user?.projects), [user?.projects]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState('');
  const [formData, setFormData] = useState(emptyProjectForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const resetModal = () => {
    setIsModalOpen(false);
    setEditingProjectId('');
    setFormData(emptyProjectForm);
    setError('');
    setIsSaving(false);
  };

  const openCreateModal = () => {
    setEditingProjectId('');
    setFormData(emptyProjectForm);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProjectId(project.id);
    setFormData({
      title: project.title || '',
      description: project.description || '',
      techStack: project.techStack || '',
      liveUrl: project.liveUrl || '',
      githubUrl: project.githubUrl || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const saveProjects = async (nextProjects) => {
    const normalizedProjects = normalizeProjects(nextProjects);
    await onUpdateUser?.({
      projects: normalizedProjects,
      projectCount: normalizedProjects.length,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = formData.title.trim();
    const description = formData.description.trim();
    const techStack = formData.techStack.trim();
    const liveUrl = formData.liveUrl.trim();
    const githubUrl = formData.githubUrl.trim();

    if (!title) {
      setError('Project title is required.');
      return;
    }

    if (!description) {
      setError('Add a short description so people know what the project does.');
      return;
    }

    if (!isLikelyUrl(liveUrl) || !isLikelyUrl(githubUrl)) {
      setError('Project links should start with http:// or https://.');
      return;
    }

    setIsSaving(true);
    setError('');

    const nextProject = {
      id: editingProjectId || `project-${Date.now()}`,
      title,
      description,
      techStack,
      liveUrl,
      githubUrl,
      createdAt: editingProjectId
        ? projects.find((project) => project.id === editingProjectId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    try {
      const nextProjects = editingProjectId
        ? projects.map((project) => (project.id === editingProjectId ? nextProject : project))
        : [nextProject, ...projects];

      await saveProjects(nextProjects);
      resetModal();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError?.message || 'Failed to save project.');
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    const nextProjects = projects.filter((project) => project.id !== projectId);

    try {
      await saveProjects(nextProjects);
    } catch (deleteError) {
      console.error(deleteError);
      window.alert(deleteError?.message || 'Failed to delete project.');
    }
  };

  return (
    <div className="w-full max-w-[1300px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">
            {userType === 'employee' ? 'My Projects' : 'Explore Projects'}
          </h1>
        </div>
        {userType === 'employee' && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <article key={project.id} className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#3a5a40] dark:text-white">{project.title}</h2>
                  {project.techStack ? (
                    <p className="mt-2 text-sm font-medium text-[#588157] dark:text-[#7dc4ff]">{project.techStack}</p>
                  ) : null}
                </div>
                {userType === 'employee' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(project)}
                      className="rounded-lg border border-[#c7d7b3] px-3 py-2 text-[#3a5a40] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#102235]"
                      aria-label={`Edit ${project.title}`}
                    >
                      <PencilLine className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project.id)}
                      className="rounded-lg border border-[#e3b3b3] px-3 py-2 text-[#9b2c2c] transition-colors hover:bg-[#fff5f5] dark:border-[#6e2f3b] dark:text-[#ffb4b4] dark:hover:bg-[#2c1320]"
                      aria-label={`Delete ${project.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-7 text-[#344e41] dark:text-[#b8d4e8]">{project.description}</p>

              {(project.liveUrl || project.githubUrl) ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {project.liveUrl ? (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-[#3a5a40] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Live Demo
                    </a>
                  ) : null}
                  {project.githubUrl ? (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] px-4 py-2 text-sm font-semibold text-[#3a5a40] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#102235]"
                    >
                      <Github className="h-4 w-4" />
                      Source Code
                    </a>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-12 text-center">
          <h2 className="text-2xl font-semibold text-[#3a5a40] dark:text-white mb-2">
            {userType === 'employee' ? 'No Projects Yet' : 'No Projects Available'}
          </h2>
          <p className="text-[#344e41] dark:text-[#b8d4e8]">
            {userType === 'employee'
              ? 'Your project showcase will appear here once you add your first project.'
              : 'Projects shared by developers will appear here soon.'}
          </p>
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[#a3b18a] bg-white p-6 shadow-xl dark:border-[#1e3a5f] dark:bg-[#162842]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#3a5a40] dark:text-white">
                  {editingProjectId ? 'Edit Project' : 'Add New Project'}
                </h2>
                <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">
                  Add the work you want recruiters and companies to see on your profile.
                </p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                aria-label="Close project modal"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#c7d7b3] text-[#3a5a40] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#102235]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#344e41] dark:text-[#d5e6f5]">Project title</label>
                <input
                  value={formData.title}
                  onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Capstone job portal"
                  className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-3 text-[#1f3a2a] outline-none transition-colors placeholder:text-[#7b8d70] focus:border-[#588157] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-white dark:placeholder:text-[#8ba9c0]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#344e41] dark:text-[#d5e6f5]">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe what the project does, what you built, and why it matters."
                  className="min-h-[140px] w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-3 text-[#1f3a2a] outline-none transition-colors placeholder:text-[#7b8d70] focus:border-[#588157] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-white dark:placeholder:text-[#8ba9c0]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#344e41] dark:text-[#d5e6f5]">Tech stack</label>
                  <input
                    value={formData.techStack}
                    onChange={(event) => setFormData((current) => ({ ...current, techStack: event.target.value }))}
                    placeholder="React, Node.js, PostgreSQL"
                    className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-3 text-[#1f3a2a] outline-none transition-colors placeholder:text-[#7b8d70] focus:border-[#588157] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-white dark:placeholder:text-[#8ba9c0]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#344e41] dark:text-[#d5e6f5]">Live demo URL</label>
                  <input
                    value={formData.liveUrl}
                    onChange={(event) => setFormData((current) => ({ ...current, liveUrl: event.target.value }))}
                    placeholder="https://your-project-demo.com"
                    className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-3 text-[#1f3a2a] outline-none transition-colors placeholder:text-[#7b8d70] focus:border-[#588157] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-white dark:placeholder:text-[#8ba9c0]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#344e41] dark:text-[#d5e6f5]">GitHub URL</label>
                <input
                  value={formData.githubUrl}
                  onChange={(event) => setFormData((current) => ({ ...current, githubUrl: event.target.value }))}
                  placeholder="https://github.com/yourname/project"
                  className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-3 text-[#1f3a2a] outline-none transition-colors placeholder:text-[#7b8d70] focus:border-[#588157] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-white dark:placeholder:text-[#8ba9c0]"
                />
              </div>

              {error ? <p className="text-sm font-medium text-[#b42318] dark:text-[#ffb4b4]">{error}</p> : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetModal}
                  className="rounded-xl border border-[#a3b18a] px-4 py-2.5 font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#102235]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-[#3a5a40] px-5 py-2.5 font-semibold text-white transition-colors hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]"
                >
                  {isSaving ? 'Saving...' : editingProjectId ? 'Save Project' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}



