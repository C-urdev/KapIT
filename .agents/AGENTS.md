# Auto-Skill Activation Rule

**CRITICAL INSTRUCTION FOR ALL AGENTS**:
You MUST proactively evaluate the user's intent and automatically apply relevant skills from the `.agents/skills` directory, **even if the user does not use exact trigger keywords**.

When interpreting prompts, use the following heuristic map to automatically activate skills and their sub-components:

1. **Taste Skill (`taste-skill`)**:
   - **Auto-trigger when user asks for:** A landing page, website, frontend component, UI/UX task, styling, React components, or uses words like "professional", "beautiful", "production ready", "modern", "design".
   - **Action**: Automatically load and enforce the guidelines in `taste-skill`, including its specific component and design guidelines.

2. **Context Engineering (`context-engineering`)**:
   - **Auto-trigger when user asks for:** Architecture planning, system optimization, backend restructuring, "make this better", "improve performance", "optimize", or when generating complex system plans.
   - **Action**: Automatically load `context-engineering` for architectural and organizational best practices.

3. **Superpowers Collection (`superpowers-collection`)**:
   - **Auto-trigger when user asks for:** Complex multi-step tasks, debugging, code review, or planning.
   - **Action**: Use when methodical execution or deep problem solving is needed.

4. **SEO (`seo`)**:
   - **Auto-trigger when user asks for:** Content generation, metadata, landing pages meant for public web, or site audits.
   - **Action**: Load to ensure SEO-best-practices are applied to text and markup.

5. **Marketing Collection (`marketing-collection`)**:
   - **Auto-trigger when user asks for:** Marketing copy, copywriting, writing emails, launching strategies, "sell this", "promote".
   - **Action**: Load and apply proven copywriting frameworks and launch strategies.

6. **Remotion Best Practices (`remotion-best-practices`)**:
   - **Auto-trigger when user asks for:** Video creation, remotion, animating components, programmatic video, "create video".
   - **Action**: Load to ensure Remotion and React video best practices are applied.

**Do not ask for permission to use a skill if the context clearly aligns with it.** Just seamlessly integrate the skill's instructions into your workflow.
