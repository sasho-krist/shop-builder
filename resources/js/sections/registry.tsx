import type { SectionDef } from '@/lib/blocks';
import { BASIC_SECTIONS } from './basic';
import { BOX_SECTIONS } from './boxes';
import { COMMERCE_SECTIONS } from './commerce';
import { INTERACTIVE_SECTIONS } from './interactive';

/**
 * Every page-builder section. Rendered identically in the admin canvas and on
 * the storefront. Order here is the order they appear in the "Add section" menu
 * (grouped by `section.group`).
 */
export const SECTIONS: SectionDef[] = [
    ...COMMERCE_SECTIONS,
    ...BASIC_SECTIONS,
    ...BOX_SECTIONS,
    ...INTERACTIVE_SECTIONS,
];

export const SECTION_GROUPS: SectionDef['group'][] = [
    'Store',
    'Basic',
    'Media',
    'Content',
    'Advanced',
];

export function getSection(type: string): SectionDef | undefined {
    return SECTIONS.find((section) => section.type === type);
}
