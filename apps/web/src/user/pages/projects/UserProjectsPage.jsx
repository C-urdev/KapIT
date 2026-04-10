import React, { useMemo, useState } from 'react';
import { ExternalLink, FileText, FolderClosed, Github, Link2, MoreHorizontal, PencilLine, Plus, Trash2, X } from 'lucide-react';

const emptyProjectForm = {
  title: '',
  description: '',
  techStack: '',
  liveUrl: '',
  githubUrl: '',
};

const folderAccents = [
  { shell: 'border border-[#6c8765] bg-[#6f8b68] text-white', tab: 'bg-[#dce8d7]', subtle: 'text-white/78', action: 'bg-white/14 text-white hover:bg-white/24' },
  { shell: 'border border-[#446845] bg-[#537b54] text-white', tab: 'bg-[#dce8d7]', subtle: 'text-white/78', action: 'bg-white/14 text-white hover:bg-white/24' },
  { shell: 'border border-[#c9d7c3] bg-[#eef3e8] text-[#2f4634]', tab: 'bg-white', subtle: 'text-[#647462]', action: 'bg-white text-[#35533b] hover:bg-[#f5f8f1]' },
  { shell: 'border border-[#d5dbc8] bg-[#f5f1e8] text-[#3f4834]', tab: 'bg-[#fffaf1]', subtle: 'text-[#776f5d]', action: 'bg-white text-[#4a5440] hover:bg-[#faf6ec]' },
  { shell: 'border border-[#d1ddd9] bg-[#edf4f1] text-[#29463d]', tab: 'bg-white', subtle: 'text-[#617970]', action: 'bg-white text-[#29463d] hover:bg-[#f5fbf8]' },
  { shell: 'border border-[#d3d8e3] bg-[#eff1f8] text-[#30415d]', tab: 'bg-white', subtle: 'text-[#657189]', action: 'bg-white text-[#30415d] hover:bg-[#f7f8fc]' },
];

const normalizeProjects = (projects) => {
  if (!Array.isArray(projects)) return [];

  return projects
    .map((project, index) => {
      if (!project || typeof project !== 'object') return null;

      const title = String(project.title || '').trim();
      const description = String(project.description || '').trim();
      const techStack = String(project.techStack || '').trim();
      const liveUrl = String(project.liveUrl || '').trim();
      const githubUrl = String(project.githubUrl || '').trim();

      if (!title) return null;

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

const formatProjectDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recently updated';

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getProjectFileSize = (project) => {
  const basis = String(project.description || project.techStack || project.title || '').length;
  return `${Math.max(2, Math.min(20, Math.ceil(basis / 12)))} MB`;
};

const getOwnerBadges = (user) => {
  const seed = String(user?.username || user?.email || 'U').trim().toUpperCase();
  return [seed[0] || 'U', seed[1] || seed[0] || 'U', seed[2] || seed[0] || 'U'];
};

const getFolderAccent = (index) => folderAccents[index % folderAccents.length];

function FolderCard({ project, index, user, userType, onEdit, onDelete, onView }) {
  const accent = getFolderAccent(index);
  const owners = getOwnerBadges(user);
  const canManage = userType === 'employee';

  return (
    <article className={`group relative min-w-[180px] rounded-[18px] p-4 shadow-[0_18px_34px_-28px_rgba(58,90,64,0.75)] sm:min-w-[195px] ${accent.shell}`}>
      <div className={`absolute left-4 top-0 h-3.5 w-14 -translate-y-[55%] rounded-t-[14px] ${accent.tab}`} />

      <div className="flex min-h-[122px] flex-col">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${accent.subtle}`}>Shared With</p>

        <div className="mt-3 flex items-center">
          {owners.map((owner, ownerIndex) => (
            <div
              key={`${project.id}-${owner}-${ownerIndex}`}
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold tracking-[0.08em] shadow-sm backdrop-blur-sm ${
                accent.subtle.includes('white')
                  ? 'border-white/60 bg-[rgba(255,255,255,0.14)] text-white'
                  : 'border-[#d5dfcf] bg-[rgba(255,255,255,0.88)] text-[#4a654d]'
              } ${ownerIndex > 0 ? '-ml-1.5' : ''}`}
            >
              {owner}
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.13em] ${accent.subtle}`}>Folder</p>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5">{project.title}</p>
          <p className={`mt-1 line-clamp-1 text-xs ${accent.subtle}`}>{project.techStack || project.description || 'Project files'}</p>
        </div>
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onView(project)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${accent.action}`}
          aria-label={`View full info for ${project.title}`}
        >
          <FileText className="h-4 w-4" />
        </button>
        {canManage ? (
          <>
          <button
            type="button"
            onClick={() => onEdit(project)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${accent.action}`}
            aria-label={`Edit ${project.title}`}
          >
            <PencilLine className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(project.id)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${accent.action}`}
            aria-label={`Delete ${project.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onView(project)}
        className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${accent.action}`}
      >
        <FileText className="h-3.5 w-3.5" />
        Full info
      </button>
    </article>
  );
}

function ProjectFileRow({ project, user, userType, onEdit, onDelete, onView, highlight = false }) {
  const owners = getOwnerBadges(user).slice(0, 2);
  const canManage = userType === 'employee';

  return (
    <div
      className={`grid grid-cols-[minmax(0,1.9fr)_76px] items-center gap-3 border-b border-[#d9ddd2] px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,2.2fr)_104px_170px_86px_40px_52px] lg:grid-cols-[minmax(0,2.5fr)_120px_190px_90px_40px_56px] ${
        highlight ? 'bg-[#e3eee2]' : 'bg-transparent'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef3e7] text-[#597459]">
          {project.githubUrl ? <Github className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#2f4735]">{project.title}</p>
          <p className="truncate text-xs text-[#7a8676]">{project.description || project.techStack || 'Project file'}</p>
        </div>
      </div>

      <div className="hidden sm:flex sm:items-center">
        <div className="flex items-center">
          {owners.map((owner, ownerIndex) => (
            <div
              key={`${project.id}-owner-${ownerIndex}`}
              className={`flex h-6 w-6 items-center justify-center rounded-full border border-white bg-[#dce8d7] text-[10px] font-semibold text-[#4c6850] ${
                ownerIndex > 0 ? '-ml-1.5' : ''
              }`}
            >
              {owner}
            </div>
          ))}
        </div>
      </div>

      <div className="hidden text-sm text-[#677866] sm:block">{formatProjectDate(project.createdAt)} · 4:30 AM</div>
      <div className="hidden text-sm text-[#677866] sm:block">{getProjectFileSize(project)}</div>

      <div className="hidden items-center justify-center text-[#97a394] sm:flex">
        <Link2 className="h-4 w-4" />
      </div>

      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onView(project)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#516c54] transition-colors hover:bg-[#edf4e7]"
          aria-label={`View full info for ${project.title}`}
        >
          <FileText className="h-4 w-4" />
        </button>
        {project.liveUrl || project.githubUrl ? (
          <a
            href={project.liveUrl || project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#516c54] transition-colors hover:bg-[#edf4e7]"
            aria-label={`Open ${project.title}`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
        {canManage ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#516c54] transition-colors hover:bg-[#edf4e7]"
              aria-label={`Edit ${project.title}`}
            >
              <PencilLine className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(project.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#a02f2f] transition-colors hover:bg-[#fff3f3]"
              aria-label={`Delete ${project.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#516c54] transition-colors hover:bg-[#edf4e7]"
            aria-label={`More actions for ${project.title}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ProjectDetailsModal({ project, onClose }) {
  if (!project) return null;

  const detailItems = [
    { label: 'Description', value: project.description || 'No description added yet.' },
    { label: 'Tech stack', value: project.techStack || 'No tech stack added yet.' },
    { label: 'Created', value: formatProjectDate(project.createdAt) },
  ];

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-[#a3b18a] bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#73826e]">Project Info</p>
            <h2 className="mt-2 text-2xl font-bold text-[#2f4735]">{project.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project info"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#c7d7b3] text-[#3a5a40] transition-colors hover:bg-[#f5f5f2]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {detailItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#d9ddd2] bg-[#f8faf5] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#768272]">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-[#304736]">{item.value}</p>
            </div>
          ))}

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={project.liveUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                project.liveUrl ? 'bg-[#416b47] text-white hover:bg-[#35573b]' : 'cursor-not-allowed bg-[#e7ece3] text-[#7b8878] pointer-events-none'
              }`}
            >
              <ExternalLink className="h-4 w-4" />
              Live demo
            </a>
            <a
              href={project.githubUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                project.githubUrl
                  ? 'border-[#a3b18a] text-[#344e41] hover:bg-[#f5f5f2]'
                  : 'pointer-events-none border-[#dde4d5] text-[#8a9488]'
              }`}
            >
              <Github className="h-4 w-4" />
              GitHub repo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyProjectsState({ userType, onCreate }) {
  return (
    <div className="rounded-[14px] border border-[#8ea184] bg-white px-6 py-12 text-center">
      <div className="mx-auto flex max-w-2xl flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#edf4e7] text-[#4e6a53]">
          <FolderClosed className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-[#2f4735]">
          {userType === 'employee' ? 'Build your project workspace' : 'No projects to show yet'}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#5f6f5f]">
          {userType === 'employee'
            ? 'Create your first folder-style project card and show recruiters the work you want them to see.'
            : 'Projects shared by developers will show up here once they start publishing their work.'}
        </p>
        {userType === 'employee' ? (
          <button
            type="button"
            onClick={onCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#416b47] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#35573b]"
          >
            <Plus className="h-4 w-4" />
            Add your first project
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function UserProjectsPage({ userType, user, onUpdateUser }) {
  const projects = useMemo(() => normalizeProjects(user?.projects), [user?.projects]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
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

  const openProjectDetails = (project) => {
    setSelectedProject(project);
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
    <div className="mx-auto w-full max-w-[1700px]">
      <section className="overflow-hidden rounded-[14px] border border-[#8ea184] bg-[#d8d3c4]">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-[#2f4735] sm:text-[2.4rem]">
                {userType === 'employee' ? 'My Projects' : 'Project Library'}
              </h1>
              <p className="mt-1 text-sm text-[#5c6d59]">Showcase your work</p>
            </div>

            {userType === 'employee' ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#416b47] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#35573b]"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
            ) : null}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4">
          {projects.length > 0 ? (
            <div className="overflow-hidden rounded-[12px] border border-[#8ea184] bg-white">
              <div className="px-4 py-4 sm:px-5">
                <div className="overflow-x-auto">
                  <div className="flex min-w-max gap-3">
                    {projects.map((project, index) => (
                      <FolderCard
                        key={project.id}
                        project={project}
                        index={index}
                        user={user}
                        userType={userType}
                        onEdit={openEditModal}
                        onDelete={handleDeleteProject}
                        onView={openProjectDetails}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#d9ddd2] px-4 py-5 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#768272]">All Files</p>

                <div className="mt-4 overflow-hidden rounded-[10px] border border-[#d9ddd2] bg-white">
                  <div className="hidden grid-cols-[minmax(0,2.5fr)_120px_190px_90px_40px_56px] gap-3 border-b border-[#d9ddd2] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7a8775] lg:grid">
                    <span>Name</span>
                    <span>Owners</span>
                    <span>Last Modified</span>
                    <span>File Size</span>
                    <span />
                    <span className="text-right">...</span>
                  </div>

                  <div>
                    {projects.map((project, index) => (
                      <ProjectFileRow
                        key={project.id}
                        project={project}
                        user={user}
                        userType={userType}
                        onEdit={openEditModal}
                        onDelete={handleDeleteProject}
                        onView={openProjectDetails}
                        highlight={index === Math.min(4, projects.length - 1)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyProjectsState userType={userType} onCreate={openCreateModal} />
          )}
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-[#a3b18a] bg-white p-5 shadow-xl sm:p-6 dark:border-[#1e3a5f] dark:bg-[#162842]">
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#c7d7b3] text-[#3a5a40] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#102235]"
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

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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

      <ProjectDetailsModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
