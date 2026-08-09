import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  FileCode2,
  FolderKanban,
  Globe,
  Link2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '@sharedComponents/ui/ToastProvider';

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

const formatDateLabel = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) {
    return 'Recently updated';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTechStack = (value) =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const getProjectAccent = (index) => {
  const accents = [
    'bg-[linear-gradient(135deg,#8ea18c,#6f836d)] text-white',
    'bg-[linear-gradient(135deg,#64845d,#456b44)] text-white',
    'bg-[linear-gradient(135deg,#eef2ea,#dfe8d9)] text-[#2e4b34]',
    'bg-[linear-gradient(135deg,#f3f5ef,#e4eadf)] text-[#2e4b34]',
    'bg-[linear-gradient(135deg,#f9fbf6,#eaf2e5)] text-[#2e4b34]',
    'bg-[linear-gradient(135deg,#eef1f7,#e4eaf4)] text-[#2e4b34]',
  ];

  return accents[index % accents.length];
};

const getFileSizeLabel = (project) => {
  const totalLength = `${project.description} ${project.techStack}`.trim().length;
  const sizeKb = Math.max(24, Math.round(totalLength / 6) || 24);
  return `${sizeKb} KB`;
};

export default function UserProjectsPage({ userType, user, onUpdateUser }) {
  const toast = useToast();
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
      toast.error(deleteError?.message || 'Failed to delete project.');
    }
  };

  const featuredProjects = projects.slice(0, 6);

  return (
    <>
      <DesktopProjectsWorkspace
        userType={userType}
        projects={projects}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDeleteProject}
      />

      <div className="mx-auto w-full max-w-[min(100%,1120px)] xl:hidden">
      <div className="mb-6 flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] min-[420px]:text-[2.15rem] font-black tracking-[-0.03em] text-[#3a5a40] dark:text-white">
            {userType === 'employee' ? 'My Projects' : 'Projects Library'}
          </h1>
        </div>

        {userType === 'employee' ? (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-1.5 min-[420px]:gap-2 rounded-[14px] min-[420px]:rounded-2xl bg-[#3a5a40] px-3.5 py-2 min-[420px]:px-5 min-[420px]:py-3 text-[13px] min-[420px]:text-sm font-semibold text-white shadow-[0_12px_24px_rgba(58,90,64,0.18)] transition-colors hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden min-[360px]:inline">New Project</span>
            <span className="inline min-[360px]:hidden">Add</span>
          </button>
        ) : null}
      </div>

      <section className="user-desktop-flat-surface overflow-hidden rounded-[28px] border border-white/40 bg-white/70 px-4 py-5 shadow-[0_20px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#22272b]/70 sm:px-6 lg:px-8">
          {projects.length > 0 ? (
            <>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-[1.55rem] min-[420px]:text-[1.95rem] font-black tracking-[-0.03em] text-[#31572c] dark:text-white">
                    {userType === 'employee' ? 'My Projects' : 'All Projects'}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                  <ProjectStat label="Total Files" value={projects.length} />
                  <ProjectStat label="With Demo" value={projects.filter((project) => project.liveUrl).length} />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {featuredProjects.map((project, index) => {
                  const tech = formatTechStack(project.techStack).slice(0, 3);
                  const accentClass = getProjectAccent(index);
                  return (
                    <article
                      key={project.id}
                      className={`relative min-h-[168px] overflow-hidden rounded-[24px] border border-white/60 p-5 shadow-[0_16px_30px_rgba(0,0,0,0.12)] transition-all hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)] ${accentClass}`}
                    >
                      <div className="absolute left-4 top-0 h-5 w-20 rounded-b-[16px] bg-[#f8fbf6]/75 dark:bg-white/10" />
                      <p className="pt-3 text-[10px] font-bold uppercase tracking-[0.22em] opacity-80">Shared Work</p>

                      <div className="mt-3 flex -space-x-2">
                        {tech.length > 0 ? (
                          tech.map((tag) => (
                            <div
                              key={`${project.id}-${tag}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-[#f8fbf6]/80 text-[10px] font-bold text-[#31572c] shadow-sm dark:border-[#274562] dark:bg-[#dfeaf6]"
                              title={tag}
                            >
                              {tag.slice(0, 1).toUpperCase()}
                            </div>
                          ))
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-[#f8fbf6]/80 text-[10px] font-bold text-[#31572c] shadow-sm dark:border-[#274562] dark:bg-[#dfeaf6]">
                            P
                          </div>
                        )}
                      </div>

                      <div className="mt-8">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-75">Folder</p>
                        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-5">{project.title}</h3>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 opacity-80">
                          {project.description}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#588157] dark:bg-[#2a2f35] dark:text-[#e2b94d]">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[1.35rem] font-black tracking-[-0.02em] text-[#31572c] dark:text-white">All Files</h3>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <div className="min-w-[720px] sm:min-w-[860px]">
                    <div className="grid grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)_minmax(0,1.05fr)_120px_88px_88px] gap-4 border-b border-[#d9e0d2] px-4 pb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#758976] dark:border-[#444d57] dark:text-[#89aeca]">
                      <div>Name</div>
                      <div>Stack</div>
                      <div>Last Modified</div>
                      <div>File Size</div>
                      <div>Links</div>
                      <div className="text-right">Actions</div>
                    </div>

                    <div className="divide-y divide-[#e4e7de] dark:divide-[#203854]">
                      {projects.map((project, index) => {
                        const stackItems = formatTechStack(project.techStack);
                        const rowTint = index % 5 === 4 ? 'bg-[#edf5ea] dark:bg-[#17314b]' : 'bg-transparent';

                        return (
                          <div
                            key={project.id}
                            className={`grid grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)_minmax(0,1.05fr)_120px_88px_88px] gap-4 px-4 py-4 transition-colors hover:bg-[#f7faf4] dark:hover:bg-[#202428] ${rowTint}`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef6ee] text-[#588157] dark:bg-[#2a2f35] dark:text-[#e2b94d]">
                                  {project.githubUrl ? <FileCode2 className="h-4 w-4" /> : <FolderKanban className="h-4 w-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#2f4e35] dark:text-white">{project.title}</p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#607461] dark:text-[#d0d7dd]">
                                    {project.description}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="min-w-0">
                              {stackItems.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {stackItems.slice(0, 2).map((item) => (
                                    <span
                                      key={`${project.id}-${item}`}
                                      className="inline-flex items-center rounded-full bg-[#f1f6ed] px-2.5 py-1 text-[11px] font-semibold text-[#466247] dark:bg-[#202428] dark:text-[#e2e6e9]"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-[#708370] dark:text-[#b3bcc5]">No stack</span>
                              )}
                            </div>

                            <div className="text-sm text-[#556a58] dark:text-[#e2e6e9]">
                              <div className="inline-flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-[#6f866b] dark:text-[#e2b94d]" />
                                {formatDateLabel(project.createdAt)}
                              </div>
                            </div>

                            <div className="text-sm text-[#556a58] dark:text-[#e2e6e9]">{getFileSizeLabel(project)}</div>

                            <div className="flex items-center gap-2 text-[#6a8167] dark:text-[#8fcdf2]">
                              {project.liveUrl ? <Globe className="h-4 w-4" /> : null}
                              {project.githubUrl ? <Link2 className="h-4 w-4" /> : null}
                              {!project.liveUrl && !project.githubUrl ? <span className="text-xs">-</span> : null}
                            </div>

                            <div className="flex items-center justify-end gap-1.5">
                              {project.liveUrl ? (
                                <a
                                  href={project.liveUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#c7d7b3] text-[#3a5a40] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-white dark:hover:bg-[#202428]"
                                  aria-label={`Open live demo for ${project.title}`}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              ) : null}
                              {userType === 'employee' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(project)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#c7d7b3] text-[#3a5a40] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-white dark:hover:bg-[#202428]"
                                    aria-label={`Edit ${project.title}`}
                                  >
                                    <PencilLine className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProject(project.id)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e3b3b3] text-[#9b2c2c] transition-colors hover:bg-[#fff5f5] dark:border-[#6e2f3b] dark:text-[#ffb4b4] dark:hover:bg-[#2c1320]"
                                    aria-label={`Delete ${project.title}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#7b8b7c] dark:text-[#92abc4]">
                                  <MoreHorizontal className="h-4 w-4" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center px-4 py-10 text-center sm:px-8">
              <div className="w-full max-w-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#eef6ee] text-[#588157] dark:bg-[#2a2f35] dark:text-[#e2b94d]">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-[#3a5a40] dark:text-white">
                {userType === 'employee' ? 'Start Your Project Shelf' : 'No Projects Yet'}
              </h3>
              {userType === 'employee' ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#3a5a40] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Project
                </button>
              ) : null}
              </div>
            </div>
          )}
      </section>

      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="user-workspace-elevated w-full max-w-2xl rounded-3xl border border-white/40 bg-white/90 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#22272b]/90 xl:rounded-lg xl:border-[var(--user-border)] xl:bg-[var(--user-surface)] xl:shadow-[var(--user-elevated-shadow)] xl:backdrop-blur-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#3a5a40] dark:text-white">
                  {editingProjectId ? 'Edit Project' : 'Add New Project'}
                </h2>
              </div>
              <button
                type="button"
                onClick={resetModal}
                aria-label="Close project modal"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#c7d7b3] text-[#3a5a40] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-white dark:hover:bg-[#202428]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#344e41] dark:text-[#e2e6e9]">Project title</label>
                <input
                  value={formData.title}
                  onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Capstone job portal"
                  className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-3 text-[#1f3a2a] outline-none transition-colors placeholder:text-[#7b8d70] focus:border-[#588157] dark:border-[#444d57] dark:bg-[#202428] dark:text-white dark:placeholder:text-[#9da7b1]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#344e41] dark:text-[#e2e6e9]">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe what the project does, what you built, and why it matters."
                  className="min-h-[140px] w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-3 text-[#1f3a2a] outline-none transition-colors placeholder:text-[#7b8d70] focus:border-[#588157] dark:border-[#444d57] dark:bg-[#202428] dark:text-white dark:placeholder:text-[#9da7b1]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#344e41] dark:text-[#e2e6e9]">Tech stack</label>
                  <input
                    value={formData.techStack}
                    onChange={(event) => setFormData((current) => ({ ...current, techStack: event.target.value }))}
                    placeholder="React, Node.js, PostgreSQL"
                    className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-3 text-[#1f3a2a] outline-none transition-colors placeholder:text-[#7b8d70] focus:border-[#588157] dark:border-[#444d57] dark:bg-[#202428] dark:text-white dark:placeholder:text-[#9da7b1]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#344e41] dark:text-[#e2e6e9]">Live demo URL</label>
                  <input
                    value={formData.liveUrl}
                    onChange={(event) => setFormData((current) => ({ ...current, liveUrl: event.target.value }))}
                    placeholder="https://your-project-demo.com"
                    className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-3 text-[#1f3a2a] outline-none transition-colors placeholder:text-[#7b8d70] focus:border-[#588157] dark:border-[#444d57] dark:bg-[#202428] dark:text-white dark:placeholder:text-[#9da7b1]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#344e41] dark:text-[#e2e6e9]">GitHub URL</label>
                <input
                  value={formData.githubUrl}
                  onChange={(event) => setFormData((current) => ({ ...current, githubUrl: event.target.value }))}
                  placeholder="https://github.com/yourname/project"
                  className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-3 text-[#1f3a2a] outline-none transition-colors placeholder:text-[#7b8d70] focus:border-[#588157] dark:border-[#444d57] dark:bg-[#202428] dark:text-white dark:placeholder:text-[#9da7b1]"
                />
              </div>

              {error ? <p className="text-sm font-medium text-[#b42318] dark:text-[#ffb4b4]">{error}</p> : null}

              <div className="flex flex-col-reverse min-[420px]:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={resetModal}
                  className="rounded-xl border border-[#a3b18a] px-4 py-2.5 font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-white dark:hover:bg-[#202428]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-[#3a5a40] px-5 py-2.5 font-semibold text-white transition-colors hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
                >
                  {isSaving ? 'Saving...' : editingProjectId ? 'Save Project' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DesktopProjectsWorkspace({ userType, projects, onCreate, onEdit, onDelete }) {
  return (
    <div className="hidden w-full xl:block">
      <header className="mb-5 flex items-end justify-between gap-6">
        <div>
          <h1 className="user-workspace-page-title mt-1">{userType === 'employee' ? 'Projects' : 'Projects library'}</h1>
          <p className="mt-1 text-sm text-[var(--user-text-muted)]">Show the work, tools, and outcomes that represent your experience.</p>
        </div>
        {userType === 'employee' ? (
          <button type="button" onClick={onCreate} className="user-workspace-primary-button inline-flex items-center gap-2 px-4 text-sm font-semibold">
            <Plus className="h-4 w-4" />
            New project
          </button>
        ) : null}
      </header>

      {projects.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between border-b border-[var(--user-border)] pb-3">
            <p className="text-sm text-[var(--user-text-muted)]">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</p>
            <p className="text-xs text-[var(--user-text-muted)]">Keep descriptions concise and link to working examples.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 2xl:grid-cols-3">
            {projects.map((project) => {
              const stackItems = formatTechStack(project.techStack);
              return (
                <article key={project.id} className="user-workspace-surface flex min-h-[260px] min-w-0 flex-col p-5 transition-colors duration-150 hover:border-[var(--user-border-strong)]">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--user-primary-soft)] text-[var(--user-primary)]">
                      <FolderKanban className="h-[18px] w-[18px]" />
                    </span>
                    <div className="flex items-center gap-1">
                      {project.liveUrl ? (
                        <a href={project.liveUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--user-text-muted)] transition-colors duration-150 hover:bg-[var(--user-surface-selected)] hover:text-[var(--user-primary)]" aria-label={`Open live demo for ${project.title}`} title="Open live demo">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                      {project.githubUrl ? (
                        <a href={project.githubUrl} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--user-text-muted)] transition-colors duration-150 hover:bg-[var(--user-surface-selected)] hover:text-[var(--user-primary)]" aria-label={`Open source code for ${project.title}`} title="Open source code">
                          <FileCode2 className="h-4 w-4" />
                        </a>
                      ) : null}
                      {userType === 'employee' ? (
                        <>
                          <button type="button" onClick={() => onEdit(project)} className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--user-text-muted)] transition-colors duration-150 hover:bg-[var(--user-surface-selected)] hover:text-[var(--user-primary)]" aria-label={`Edit ${project.title}`} title="Edit project">
                            <PencilLine className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => onDelete(project.id)} className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--user-danger)] transition-colors duration-150 hover:bg-red-50 dark:hover:bg-red-950/30" aria-label={`Delete ${project.title}`} title="Delete project">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 min-w-0">
                    <h2 className="truncate text-lg font-semibold text-[var(--user-text-strong)]">{project.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--user-text)]">{project.description}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {stackItems.length > 0 ? stackItems.slice(0, 5).map((item) => (
                      <span key={`${project.id}-${item}`} className="rounded-md border border-[var(--user-border)] bg-[var(--user-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--user-text)]">{item}</span>
                    )) : <span className="text-xs text-[var(--user-text-muted)]">No technology stack added</span>}
                  </div>

                  <div className="mt-auto flex items-center gap-2 border-t border-[var(--user-border)] pt-4 text-xs text-[var(--user-text-muted)]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Updated {formatDateLabel(project.createdAt)}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="user-workspace-surface flex min-h-[380px] items-center justify-center px-8 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[var(--user-primary-soft)] text-[var(--user-primary)]"><FolderKanban className="h-6 w-6" /></span>
            <h2 className="mt-4 text-xl font-semibold text-[var(--user-text-strong)]">Start your project portfolio</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--user-text-muted)]">Add work that demonstrates your role, tools, decisions, and results.</p>
            {userType === 'employee' ? (
              <button type="button" onClick={onCreate} className="user-workspace-primary-button mt-5 inline-flex items-center gap-2 px-5 text-sm font-semibold"><Plus className="h-4 w-4" />Add your first project</button>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

function ProjectStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#dce5d4] bg-[#f8fbf6] px-4 py-3 text-left dark:border-[#444d57] dark:bg-[#202428]">
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6a8069] dark:text-[#8db4cf]">{label}</div>
      <div className="mt-1 text-xl font-black text-[#31572c] dark:text-white">{value}</div>
    </div>
  );
}
