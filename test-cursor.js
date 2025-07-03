// Test file for cursor position preservation

import { something } from 'somewhere';
import { 
    multiline,
    import as example
} from 'another-place';

function testFunction() {
    // Put cursor here on line 10 and type something
    const x = 42;
    
    console.log(
        'This should be folded',
        'Multiple lines',
        x
    );
    
    logger.info('Single line - should not fold');
    
    logger.error(
        'This should also fold',
        { data: x }
    );
    
    // Cursor should stay here when folding happens
    return x;
}