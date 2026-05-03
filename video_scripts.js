const KIND_KINGDOM_VIDEO_SCRIPTS = Object.fromEntries(
  KIND_KINGDOM_GAMES.map((game) => [
    game.slug,
    {
      title: game.title,
      narration: [
        `In ${game.title}, our royal helpers notice a problem in the kingdom.`,
        game.mission,
        `The important lesson is simple: ${game.lesson}`,
        "Watch the helpers practice the lesson, then try it yourself in the mini game."
      ],
      scenes: [
        `Opening: show the kingdom setting for ${game.title}.`,
        `Problem: show a child facing the exact choice from the lesson, not a vague symbol.`,
        `Action: show the kind, safe, or thoughtful behavior step by step.`,
        `Result: show how the choice helps friends, the community, or the child feel better.`
      ]
    }
  ])
);
