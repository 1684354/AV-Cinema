# Task 8: MovieCard Component — Report

**Status:** Complete

**Commit SHA:** 59f7b96

**Build result:** Succeeded (no errors, only pre-existing warnings about chunk size and rollup comments in node_modules)

## What was done

Created `src/components/MovieCard.vue` — a reusable movie card component matching the darkroom mockup design:

- **Props/Emits:** Accepts `movie: any` prop; emits `deleted(id)` and `favChanged(id, isFav)` events
- **Computed properties:**
  - `isNew` — checks if `created_at` is within 7 days
  - `hasFlags` — true if any flag badge should show
  - `parsedTags` — parses tags from string/array/object
  - `tagClass` — returns `'r'` (rose) for actress-related keywords, `'b'` (blue) otherwise
- **Flag badges:** `🔥 精选` (if new), `中字`, `无码`, `破解`
- **Favorite heart toggle** (♡/♥) with `@click.stop` to prevent card navigation
- **Context menu (Teleport to body):** Play, open file location, edit, separator, favorite, delete
- **Click** navigates to `/movie/${id}`
- **Hover effect:** translateY(-5px), enhanced shadow, 1px rose border
- **Document click listener** to close context menu (registered on mount, cleaned up on unmount)
- **Context menu styles are global** (non-scoped `<style>`) because Teleport moves them outside the component's scoped root

## Concerns

- The context menu styles are in a separate non-scoped `<style>` block since Teleport moves the DOM outside the scoped root. This is the standard Vue approach for teleported content but means `.ctx-menu`/`.ctx-item`/`.ctx-sep` class names are global. A naming collision is unlikely given the project size, but worth noting.
- `MovieList.vue` remains a placeholder and doesn't use this component yet — that will be wired up in a later task.
