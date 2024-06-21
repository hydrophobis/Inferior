// Deprecated because i want this mod to work on IOS(Fuck apple tho)
const liquidSorter = extendContent(LiquidRouter, "liquid-sorter", {
    load() {
        this.super$load();
        this.cross = Core.atlas.find(this.name + "-cross", "cross-full");
    },

    drawPlanConfig(buildPlan, list) {
        Draw.rect(this.cross, buildPlan.drawx(), buildPlan.drawy());
    },

    configured(tile, player, value) {
        if (!headless) {
            renderer.minimap.update(tile);
        }
    },

    buildConfiguration(tile, table) {
        const liquids = Vars.content.liquids();
        const selectedLiquid = tile.liquids.current();

        liquids.each(liquid => {
            const button = new ImageButton(liquid.uiIcon);
            button.clicked(() => tile.configure(liquid));
            button.update(() => button.setChecked(selectedLiquid === liquid));
            table.add(button).size(40);
        });
    },

    config() {
        return null;
    },

    update(tile) {
        const currentLiquid = tile.entity.liquids.current();

        if (currentLiquid != null) {
            this.routeLiquid(tile, currentLiquid);
        }
    },

    routeLiquid(tile, liquid) {
        const neighbors = tile.getLinkedTilesAs(tile, true);
        let targetTile = null;

        neighbors.each((neighbor, index) => {
            if (neighbor != null && neighbor.block() != Blocks.air) {
                if (neighbor.acceptLiquid(tile, liquid)) {
                    targetTile = neighbor;
                    return false;
                }
            }
        });

        if (targetTile != null) {
            tile.entity.liquids.moveLiquid(targetTile, liquid, Math.min(10, tile.entity.liquids.get(liquid)));
        }
    },

    icons() {
        return [Core.atlas.find(this.name), this.cross];
    }
});

// Define the build class for the liquid sorter
const LiquidSorterBuild = extendContent(LiquidRouter.LiquidRouterBuild, liquidSorter, {
    sortLiquid: null,

    configured(player, value) {
        this.super$configured(player, value);
        this.sortLiquid = value;
        renderer.minimap.update(this.tile);
    },

    acceptLiquid(source, liquid) {
        return this.team === source.team && (this.sortLiquid == null || this.sortLiquid === liquid);
    },

    handleLiquid(source, liquid, amount) {
        if (this.sortLiquid == null || this.sortLiquid === liquid) {
            this.liquids.add(liquid, amount);
        } else {
            this.routeLiquid(liquid);
        }
    },

    routeLiquid(liquid) {
        const neighbors = this.getTile().getLinkedTilesAs(this.getTile(), true);
        let targetTile = null;

        neighbors.each((neighbor, index) => {
            if (neighbor != null && neighbor.block() != Blocks.air) {
                if (neighbor.acceptLiquid(this, liquid)) {
                    targetTile = neighbor;
                    return false;
                }
            }
        });

        if (targetTile != null) {
            this.liquids.moveLiquid(targetTile, liquid, Math.min(10, this.liquids.get(liquid)));
        }
    }
});

Vars.content.blocks().add(liquidSorter);

Events.on(ClientLoadEvent, () => {
    liquidSorter.load();
    Vars.content.blocks().add(liquidSorter);
});
