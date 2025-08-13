#!/bin/bash
set -e

# OpenAPI Sync Checker
# Performs smart comparison of local vs remote API specs, ignoring metadata noise

# Default values
LOCAL_SPEC="libs/vre/3rd-party-services/open-api/dsp-api_spec.yaml"
REMOTE_URL="https://api.dev.dasch.swiss/api/docs/docs.yaml"
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -l, --local-spec PATH     Path to local spec file (default: $LOCAL_SPEC)"
    echo "  -r, --remote-url URL      Remote API spec URL (default: $REMOTE_URL)"
    echo "  -v, --verbose            Show verbose output including diff details"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Check with default settings"
    echo "  $0 --verbose                 # Show detailed diff output"
    echo "  $0 -l my-spec.yaml          # Use custom local spec file"
}

log() {
    echo -e "$1"
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "$1"
    fi
}

check_dependencies() {
    if ! command -v yq &> /dev/null; then
        log "${RED}❌ Error: yq is required but not installed.${NC}"
        log "Install with: brew install yq (macOS) or apt-get install yq (Ubuntu)"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log "${RED}❌ Error: curl is required but not installed.${NC}"
        exit 1
    fi
    
    if ! command -v diff &> /dev/null; then
        log "${RED}❌ Error: diff is required but not installed.${NC}"
        exit 1
    fi
}

clean_spec() {
    local input_file="$1"
    local output_file="$2"
    
    log_verbose "Cleaning spec: $input_file -> $output_file"
    
    yq eval '
        del(.info.version, .info.title, .info.description, .info.contact) |
        del(.servers) |
        del(.. | .description?) |
        del(.. | .summary?) |
        del(.. | .examples?) |
        del(.. | .example?) |
        del(.. | .tags?)
    ' "$input_file" > "$output_file"
}

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -l|--local-spec)
                LOCAL_SPEC="$2"
                shift 2
                ;;
            -r|--remote-url)
                REMOTE_URL="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log "${RED}❌ Unknown option: $1${NC}"
                usage
                exit 1
                ;;
        esac
    done

    log "${YELLOW}🔍 Checking OpenAPI spec synchronization...${NC}"
    log_verbose "Local spec: $LOCAL_SPEC"
    log_verbose "Remote URL: $REMOTE_URL"

    # Check dependencies
    check_dependencies

    # Verify local spec exists
    if [ ! -f "$LOCAL_SPEC" ]; then
        log "${RED}❌ Local spec file not found: $LOCAL_SPEC${NC}"
        exit 1
    fi

    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf $TEMP_DIR" EXIT

    # Download remote spec
    log_verbose "Downloading remote spec..."
    if ! curl -s -f -o "$TEMP_DIR/remote-spec.yaml" "$REMOTE_URL"; then
        log "${RED}❌ Failed to download remote spec from: $REMOTE_URL${NC}"
        exit 1
    fi

    # Clean both specs (remove metadata noise)
    log_verbose "Cleaning specs for comparison..."
    clean_spec "$LOCAL_SPEC" "$TEMP_DIR/clean-local.yaml"
    clean_spec "$TEMP_DIR/remote-spec.yaml" "$TEMP_DIR/clean-remote.yaml"

    # Compare cleaned specs
    log_verbose "Comparing cleaned specifications..."
    if diff -q "$TEMP_DIR/clean-local.yaml" "$TEMP_DIR/clean-remote.yaml" > /dev/null; then
        log "${GREEN}✅ OpenAPI spec is up-to-date (no meaningful API changes)${NC}"
        exit 0
    else
        log "${RED}❌ API spec has meaningful changes!${NC}"
        log "Detected changes in API structure, endpoints, or schemas (ignoring metadata)."
        log ""
        log "${YELLOW}To update the spec file and regenerate OpenAPI code:${NC}"
        log "  npm run update-openapi"
        log ""
        log "${YELLOW}Or manually:${NC}"
        log "  curl -o $LOCAL_SPEC $REMOTE_URL"
        log "  npm run generate-openapi-module"
        
        if [ "$VERBOSE" = true ]; then
            log ""
            log "${YELLOW}Meaningful changes detected:${NC}"
            diff "$TEMP_DIR/clean-local.yaml" "$TEMP_DIR/clean-remote.yaml" | head -20 || true
        fi
        
        exit 1
    fi
}

main "$@"