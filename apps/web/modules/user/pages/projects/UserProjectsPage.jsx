import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  FileCode2,
  FolderKanban,
  Github,
  Globe,
  Link2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

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

  const featuredProjects = projects.slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-[1320px]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[2.15rem] font-black tracking-[-0.03em] text-[#3a5a40] dark:text-white">
            {userType === 'employee' ? 'My Projects' : 'Projects Library'}
          </h1>
          <p className="mt-1 text-base text-[#4f6650] dark:text-[#b8d4e8]">
            {userType === 'employee'
              ? 'Showcase your work in a cleaner, portfolio-style workspace.'
              : 'Browse published developer work in a structured projects view.'}
          </p>
        </div>

        {userType === 'employee' ? (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#3a5a40] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(58,90,64,0.18)] transition-colors hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-[30px] border border-[#93a977] bg-[linear-gradient(180deg,#dcd7c9_0%,#d8d4c7_100%)] p-4 shadow-[0_22px_60px_rgba(58,90,64,0.10)] dark:border-[#1e3a5f] dark:bg-[linear-gradient(180deg,#11253b_0%,#0d1c2f_100%)] sm:p-6">
        <div className="rounded-[28px] border border-[#7f9775] bg-white px-4 py-5 shadow-[0_18px_50px_rgba(58,90,64,0.08)] dark:border-[#2a4a6f] dark:bg-[#162842] sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6d8467] dark:text-[#7dc4ff]">
                Workspace
              </p>
              <h2 className="mt-2 text-[1.95rem] font-black tracking-[-0.03em] text-[#31572c] dark:text-white">
                {userType === 'employee' ? 'My Projects' : 'All Projects'}
              </h2>
              <p className="mt-1 text-sm text-[#556b58] dark:text-[#b8d4e8]">
                Keep your strongest work visible with a folder shelf up top and a full projects list below.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <ProjectStat label="Total Files" value={projects.length} />
              <ProjectStat label="With Demo" value={projects.filter((project) => project.liveUrl).length} />
            </div>
          </div>

          {projects.length > 0 ? (
            <>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {featuredProjects.map((project, index) => {
                  const tech = formatTechStack(project.techStack).slice(0, 3);
                  const accentClass = getProjectAccent(index);
                  return (
                    <article
                      key={project.id}
                      className={`relative min-h-[168px] overflow-hidden rounded-[24px] border border-white/60 p-5 shadow-[0_16px_30px_rgba(58,90,64,0.16)] ${accentClass}`}
                    >
                      <div className="absolute left-4 top-0 h-5 w-20 rounded-b-[16px] bg-white/75 dark:bg-white/10" />
                      <p className="pt-3 text-[10px] font-bold uppercase tracking-[0.22em] opacity-80">Shared Work</p>

                      <div className="mt-3 flex -space-x-2">
                        {tech.length > 0 ? (
                          tech.map((tag) => (
                            <div
                              key={`${project.id}-${tag}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/80 text-[10px] font-bold text-[#31572c] shadow-sm dark:border-[#274562] dark:bg-[#dfeaf6]"
                              title={tag}
                            >
                              {tag.slice(0, 1).toUpperCase()}
                            </div>
                          ))
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/80 text-[10px] font-bold text-[#31572c] shadow-sm dark:border-[#274562] dark:bg-[#dfeaf6]">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#588157] dark:bg-[#14304d] dark:text-[#7dc4ff]">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[1.35rem] font-black tracking-[-0.02em] text-[#31572c] dark:text-white">All Files</h3>
                    <p className="text-sm text-[#5e745f] dark:text-[#b8d4e8]">A clean list view of every project in your showcase.</p>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <div className="min-w-[860px]">
                    <div className="grid grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)_minmax(0,1.05fr)_120px_88px_88px] gap-4 border-b border-[#d9e0d2] px-4 pb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#758976] dark:border-[#2a4a6f] dark:text-[#89aeca]">
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
                            className={`grid grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)_minmax(0,1.05fr)_120px_88px_88px] gap-4 px-4 py-4 transition-colors hover:bg-[#f7faf4] dark:hover:bg-[#102235] ${rowTint}`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef6ee] text-[#588157] dark:bg-[#14304d] dark:text-[#7dc4ff]">
                                  {project.githubUrl ? <FileCode2 className="h-4 w-4" /> : <FolderKanban className="h-4 w-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#2f4e35] dark:text-white">{project.title}</p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#607461] dark:text-[#b8d4e8]">
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
                                      className="inline-flex items-center rounded-full bg-[#f1f6ed] px-2.5 py-1 text-[11px] font-semibold text-[#466247] dark:bg-[#102235] dark:text-[#d5e6f5]"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-[#708370] dark:text-[#9fb4ca]">No stack</span>
                              )}
                            </div>

                            <div className="text-sm text-[#556a58] dark:text-[#d5e6f5]">
                              <div className="inline-flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-[#6f866b] dark:text-[#7dc4ff]" />
                                {formatDateLabel(project.createdAt)}
                              </div>
                            </div>

                            <div className="text-sm text-[#556a58] dark:text-[#d5e6f5]">{getFileSizeLabel(project)}</div>

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
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#c7d7b3] text-[#3a5a40] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#102235]"
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
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#c7d7b3] text-[#3a5a40] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#102235]"
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
            <div className="mt-8 rounded-[24px] border border-dashed border-[#bfd0af] bg-[#f8fbf6] p-10 text-center dark:border-[#2a4a6f] dark:bg-[#102235]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#eef6ee] text-[#588157] dark:bg-[#14304d] dark:text-[#7dc4ff]">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-[#3a5a40] dark:text-white">
                {userType === 'employee' ? 'Start Your Project Shelf' : 'No Projects Yet'}
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[#556b58] dark:text-[#b8d4e8]">
                {userType === 'employee'
                  ? 'Add your first project and this page will turn into a polished workspace with featured folders and a full files table.'
                  : 'Published developer projects will appear here once creators start sharing their work.'}
              </p>
              {userType === 'employee' ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#3a5a40] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Project
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

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

function ProjectStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#dce5d4] bg-[#f8fbf6] px-4 py-3 text-left dark:border-[#2a4a6f] dark:bg-[#102235]">
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6a8069] dark:text-[#8db4cf]">{label}</div>
      <div className="mt-1 text-xl font-black text-[#31572c] dark:text-white">{value}</div>
    </div>
  );
}
