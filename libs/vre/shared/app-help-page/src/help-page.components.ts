import { FooterComponent } from './lib/footer/footer.component';
import { GridComponent } from './lib/grid/grid.component';
import { HelpPageComponent } from './lib/help-page/help-page.component';

/**
 * @deprecated All components are now standalone. Import them directly instead.
 * This array is kept for backward compatibility during migration.
 */
export const HelpPageComponents = [HelpPageComponent, FooterComponent, GridComponent];
