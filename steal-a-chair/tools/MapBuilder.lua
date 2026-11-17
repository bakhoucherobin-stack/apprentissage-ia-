--[[
  MapBuilder.lua : génère TOUTE la map de "Steal a Chair" en Parts (placeholders).

  COMMENT L'UTILISER
  1. Ouvre Roblox Studio, ouvre ta place.
  2. Affichage > Barre de commande (View > Command Bar).
  3. Colle TOUT ce fichier dans la barre et appuie sur Entrée.
  4. La map apparaît dans Workspace > Map. Relancer le script SUPPRIME et recrée Workspace.Map
     (donc ne le relance pas après avoir peaufiné à la main, ou mets REBUILD = false).
  Tout se règle dans la section PARAMÈTRES juste en dessous.

  Ce script n'utilise que du Lua simple (pas de syntaxe avancée) pour passer dans la barre de commande.
  Axe Z = longueur de la map. Chaque base est construite dans un repère local :
  l'ENTRÉE est du côté +Z local, le dossier de la chaise est du côté -Z local.
]]

---------------------------------------------------------------------------------------------------
-- PARAMÈTRES (modifie ici)
---------------------------------------------------------------------------------------------------
local P = {
	REBUILD = true,              -- true = supprime l'ancienne Workspace.Map avant de reconstruire

	-- Sol et dimensions générales (studs)
	FLOOR_W = 260, FLOOR_L = 560,
	WALL_H = 40, WALL_T = 6,

	-- Tapis roulant
	CONVEYOR_LEN = 540, LANE_W = 20, LANE_SPACING = 24, CONVEYOR_SPEED = 10,

	-- Bases
	PLOTS_PER_SIDE = 5, PLOT_X = 93, PLOT_SPACING = 107, PLOT_SIZE = 44,
	SEAT_Y = 5,                  -- hauteur de l'assise (plateforme) au-dessus du sol
	FLOOR2_OFFSET = 18,          -- hauteur du 2e étage au-dessus de l'assise

	-- Statues dans les murs
	STATUE_STEP = 53.5,          -- espacement des statues le long des murs latéraux
	STATUE_COUNT_SIDE = 11,      -- statues par mur latéral (centrées sur Z=0)
	STATUE_COUNT_END = 5,        -- statues par mur de bout

	STAGE_PREVIEW = true,        -- true = aligne les 5 stades de base au bout de la map pour les voir

	-- Couleurs
	C = {
		floor     = Color3.fromRGB(38, 28, 30),
		floorLine = Color3.fromRGB(110, 50, 190),
		wall      = Color3.fromRGB(22, 20, 30),
		belt      = Color3.fromRGB(35, 35, 45),
		neon      = Color3.fromRGB(150, 60, 255),
		auraDark  = Color3.fromRGB(25, 5, 45),
		gold      = Color3.fromRGB(235, 185, 50),
		wood      = Color3.fromRGB(139, 90, 43),
	},
}

---------------------------------------------------------------------------------------------------
-- OUTILS
---------------------------------------------------------------------------------------------------
local Lighting = game:GetService("Lighting")
local ServerStorage = game:GetService("ServerStorage")
local C = P.C
local RAD = math.rad
local partCount = 0

local function make(className, props, parent)
	local o = Instance.new(className)
	for k, v in pairs(props) do o[k] = v end
	o.Parent = parent
	return o
end

-- Crée une Part ancrée. extra = table de propriétés optionnelles (Transparency, CanCollide, Shape…)
local function part(parent, name, size, cf, color, material, extra)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if extra then
		for k, v in pairs(extra) do p[k] = v end
	end
	p.Parent = parent
	partCount = partCount + 1
	return p
end

-- Cylindre VERTICAL (l'axe d'un cylindre Roblox est X, on le tourne)
local function cyl(parent, name, diam, height, cf, color, material, extra)
	local e = { Shape = Enum.PartType.Cylinder }
	if extra then for k, v in pairs(extra) do e[k] = v end end
	return part(parent, name, Vector3.new(height, diam, diam), cf * CFrame.Angles(0, 0, RAD(90)), color, material, e)
end

local function wedge(parent, name, size, cf, color, material, extra)
	local w = Instance.new("WedgePart")
	w.Name = name
	w.Anchored = true
	w.Size = size
	w.CFrame = cf
	w.Color = color
	w.Material = material or Enum.Material.SmoothPlastic
	if extra then for k, v in pairs(extra) do w[k] = v end end
	w.Parent = parent
	partCount = partCount + 1
	return w
end

local function model(parent, name)
	return make("Model", { Name = name }, parent)
end

local function folder(parent, name)
	return make("Folder", { Name = name }, parent)
end

local function sizeSeq(a, b)
	return NumberSequence.new({ NumberSequenceKeypoint.new(0, a), NumberSequenceKeypoint.new(1, b) })
end

-- Feu / flammes (ParticleEmitter). colA -> colB au cours de la vie de la particule.
local function fire(parent, colA, colB, rate, size)
	return make("ParticleEmitter", {
		Name = "Flamme",
		Texture = "rbxasset://textures/particles/fire_main.dds",
		Color = ColorSequence.new(colA, colB),
		LightEmission = 1,
		Rate = rate or 30,
		Lifetime = NumberRange.new(0.8, 1.5),
		Speed = NumberRange.new(2, 5),
		Size = sizeSeq(size or 2.5, 0),
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.1), NumberSequenceKeypoint.new(1, 1) }),
		SpreadAngle = Vector2.new(12, 12),
		Rotation = NumberRange.new(0, 360),
	}, parent)
end

local function embers(parent, col)
	return make("ParticleEmitter", {
		Name = "Braises",
		Texture = "rbxasset://textures/particles/sparkles_main.dds",
		Color = ColorSequence.new(col),
		LightEmission = 1,
		Rate = 10,
		Lifetime = NumberRange.new(1.5, 3),
		Speed = NumberRange.new(3, 7),
		Size = sizeSeq(0.5, 0),
		SpreadAngle = Vector2.new(40, 40),
		Acceleration = Vector3.new(0, 4, 0),
	}, parent)
end

local function light(parent, color, range, brightness)
	return make("PointLight", { Color = color, Range = range, Brightness = brightness or 2 }, parent)
end

-- Panneau texte sur une face d'une Part
local function sign(p, text, face, textColor, bg)
	local g = make("SurfaceGui", {
		Face = face, SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud, PixelsPerStud = 40,
		LightInfluence = 0, Name = "Texte",
	}, p)
	make("TextLabel", {
		Size = UDim2.fromScale(1, 1), BackgroundColor3 = bg or Color3.new(0, 0, 0), BackgroundTransparency = bg and 0 or 1,
		Text = text, TextScaled = true, Font = Enum.Font.FredokaOne, TextColor3 = textColor or Color3.new(1, 1, 1),
	}, g)
	return g
end

---------------------------------------------------------------------------------------------------
-- NETTOYAGE
---------------------------------------------------------------------------------------------------
if P.REBUILD then
	local old = workspace:FindFirstChild("Map")
	if old then old:Destroy() end
	local oldS = ServerStorage:FindFirstChild("BaseStages")
	if oldS then oldS:Destroy() end
end
local Map = folder(workspace, "Map")
local Plots = folder(Map, "Plots")
local Decor = folder(Map, "Decor")

---------------------------------------------------------------------------------------------------
-- AMBIANCE : ciel noir, éclairage sombre, brume violette
---------------------------------------------------------------------------------------------------
for _, name in ipairs({ "Sky", "Atmosphere", "MapBloom", "MapColor" }) do
	local o = Lighting:FindFirstChild(name)
	if o then o:Destroy() end
end
Lighting.ClockTime = 0
Lighting.Brightness = 0.4
Lighting.Ambient = Color3.fromRGB(38, 22, 60)
Lighting.OutdoorAmbient = Color3.fromRGB(30, 18, 50)
Lighting.ColorShift_Top = Color3.fromRGB(80, 40, 140)
Lighting.GlobalShadows = true
Lighting.FogColor = Color3.fromRGB(10, 5, 20)
Lighting.FogStart = 200
Lighting.FogEnd = 900
make("Sky", { Name = "Sky", CelestialBodiesShown = false, StarCount = 0,
	SkyboxBk = "", SkyboxDn = "", SkyboxFt = "", SkyboxLf = "", SkyboxRt = "", SkyboxUp = "" }, Lighting)
make("Atmosphere", { Name = "Atmosphere", Density = 0.35, Offset = 0, Color = Color3.fromRGB(70, 30, 110),
	Decay = Color3.fromRGB(20, 5, 40), Glare = 0, Haze = 1.2 }, Lighting)
make("BloomEffect", { Name = "MapBloom", Intensity = 0.6, Size = 30, Threshold = 1.1 }, Lighting)
make("ColorCorrectionEffect", { Name = "MapColor", Saturation = 0.15, Contrast = 0.1, TintColor = Color3.fromRGB(235, 220, 255) }, Lighting)

---------------------------------------------------------------------------------------------------
-- SOL
---------------------------------------------------------------------------------------------------
local Ground = model(Decor, "Ground")
part(Ground, "Floor", Vector3.new(P.FLOOR_W, 2, P.FLOOR_L), CFrame.new(0, -1, 0), C.floor, Enum.Material.WoodPlanks)
-- Motifs au sol : un emblème "chaise" (assise + dossier + 2 pieds en néon) dans chaque couloir
local function floorEmblem(parent, x, z)
	local m = model(parent, "FloorEmblem")
	local cf = CFrame.new(x, 0.06, z)
	part(m, "Seat", Vector3.new(8, 0.1, 6), cf, C.floorLine, Enum.Material.Neon, { CanCollide = false })
	part(m, "Back", Vector3.new(8, 0.1, 1.5), cf * CFrame.new(0, 0, -4.5), C.floorLine, Enum.Material.Neon, { CanCollide = false })
	part(m, "LegL", Vector3.new(1.5, 0.1, 3), cf * CFrame.new(-3, 0, 4.5), C.floorLine, Enum.Material.Neon, { CanCollide = false })
	part(m, "LegR", Vector3.new(1.5, 0.1, 3), cf * CFrame.new(3, 0, 4.5), C.floorLine, Enum.Material.Neon, { CanCollide = false })
end
for k = -4, 4 do
	floorEmblem(Ground, -52, k * P.PLOT_SPACING / 2 + P.PLOT_SPACING / 4)
	floorEmblem(Ground, 52, k * P.PLOT_SPACING / 2 + P.PLOT_SPACING / 4)
end

---------------------------------------------------------------------------------------------------
-- TAPIS ROULANT (3 voies)
---------------------------------------------------------------------------------------------------
local Conveyor = model(Map, "Conveyor")
for i = -1, 1 do
	local lane = part(Conveyor, "Lane" .. (i + 2), Vector3.new(P.LANE_W, 1, P.CONVEYOR_LEN),
		CFrame.new(i * P.LANE_SPACING, 0.5, 0), C.belt, Enum.Material.Metal)
	lane:SetAttribute("Speed", P.CONVEYOR_SPEED)
	lane:SetAttribute("LaneIndex", i + 2)
	-- flèches de direction (néon) : le tapis avance de Start (Z négatif) vers End (Z positif)
	for z = -240, 240, 40 do
		part(Conveyor, "Chevron", Vector3.new(8, 0.1, 1.2), CFrame.new(i * P.LANE_SPACING, 1.05, z), C.neon,
			Enum.Material.Neon, { CanCollide = false })
	end
end
for _, x in ipairs({ -12, 12 }) do
	part(Conveyor, "LaneDivider", Vector3.new(1.5, 2, P.CONVEYOR_LEN), CFrame.new(x, 1, 0), C.auraDark, Enum.Material.Metal)
	part(Conveyor, "LaneGlow", Vector3.new(0.3, 0.3, P.CONVEYOR_LEN), CFrame.new(x, 2.1, 0), C.neon, Enum.Material.Neon, { CanCollide = false })
end
for _, x in ipairs({ -35.5, 35.5 }) do
	part(Conveyor, "Rail", Vector3.new(2, 3, P.CONVEYOR_LEN), CFrame.new(x, 1.5, 0), C.auraDark, Enum.Material.Metal)
	part(Conveyor, "RailGlow", Vector3.new(0.3, 0.3, P.CONVEYOR_LEN), CFrame.new(x, 3.1, 0), C.neon, Enum.Material.Neon, { CanCollide = false })
end
local half = P.CONVEYOR_LEN / 2
local startPt = part(Conveyor, "Start", Vector3.new(70, 8, 2), CFrame.new(0, 4, -half), C.auraDark, Enum.Material.Metal,
	{ Transparency = 0.5, CanCollide = false })
make("Attachment", { Name = "SpawnPoint" }, startPt)
part(Conveyor, "End", Vector3.new(70, 8, 2), CFrame.new(0, 4, half), C.auraDark, Enum.Material.Metal,
	{ Transparency = 0.5, CanCollide = false })
Conveyor.PrimaryPart = Conveyor:FindFirstChild("Lane2")

-- Lampadaires violets le long du tapis
local lamps = folder(Decor, "ConveyorLamps")
for z = -240, 240, 60 do
	for _, x in ipairs({ -40, 40 }) do
		local m = model(lamps, "Lamp")
		part(m, "Pole", Vector3.new(1, 14, 1), CFrame.new(x, 7, z), C.auraDark, Enum.Material.Metal)
		local orb = part(m, "Orb", Vector3.new(3, 3, 3), CFrame.new(x, 15, z), C.neon, Enum.Material.Neon, { Shape = Enum.PartType.Ball })
		light(orb, C.neon, 45, 2)
	end
end

---------------------------------------------------------------------------------------------------
-- BASES EN FORME DE CHAISE : 5 stades
---------------------------------------------------------------------------------------------------
-- Données par stade (le détail d'équilibrage viendra à l'étape 3)
local STAGES = {
	{ name = "Tabouret en bois",  perRow = 5, upper = 0, backH = 8,  legColor = C.wood,                       seatColor = Color3.fromRGB(160, 110, 60),  mat = Enum.Material.Wood },
	{ name = "Chaise rembourrée", perRow = 6, upper = 0, backH = 14, legColor = Color3.fromRGB(110, 60, 30),  seatColor = Color3.fromRGB(120, 30, 60),   mat = Enum.Material.Wood },
	{ name = "Fauteuil violet",   perRow = 7, upper = 0, backH = 20, legColor = Color3.fromRGB(60, 35, 90),   seatColor = Color3.fromRGB(90, 40, 160),   mat = Enum.Material.Fabric },
	{ name = "Fauteuil royal",    perRow = 7, upper = 2, backH = 26, legColor = Color3.fromRGB(30, 25, 40),   seatColor = Color3.fromRGB(150, 60, 255),  mat = Enum.Material.Marble },
	{ name = "Trône géant",       perRow = 7, upper = 4, backH = 34, legColor = Color3.fromRGB(20, 15, 30),   seatColor = Color3.fromRGB(235, 185, 50),  mat = Enum.Material.Marble },
}

local function spread(n, maxSpan)
	-- positions X centrées pour n slots, sur une largeur maxSpan
	local step = n > 1 and math.min(8, maxSpan / (n - 1)) or 0
	local out = {}
	for i = 1, n do out[i] = (i - (n + 1) / 2) * step end
	return out
end

-- Construit un Model "BaseStage<k>" dans le repère `root` (entrée vers +Z local).
local function buildStage(parent, k, root)
	local S = STAGES[k]
	local Y = P.SEAT_Y
	local HALF = P.PLOT_SIZE / 2
	local m = model(parent, "BaseStage" .. k)
	m:SetAttribute("Stage", k)
	m:SetAttribute("StageName", S.name)
	local function at(x, y, z) return root * CFrame.new(x, y, z) end

	local anchor = part(m, "Anchor", Vector3.new(1, 1, 1), at(0, 0.5, 0), C.neon, nil, { Transparency = 1, CanCollide = false })
	m.PrimaryPart = anchor

	-- Structure : assise (plateforme), 4 pieds, dossier
	local body = model(m, "Body")
	part(body, "Seat", Vector3.new(P.PLOT_SIZE, 1.5, P.PLOT_SIZE), at(0, Y - 0.75, 0), S.seatColor, S.mat)
	for _, sx in ipairs({ -1, 1 }) do
		for _, sz in ipairs({ -1, 1 }) do
			part(body, "Leg", Vector3.new(5, Y - 1.5, 5), at(sx * (HALF - 3), (Y - 1.5) / 2, sz * (HALF - 3)), S.legColor, S.mat)
		end
	end
	part(body, "Backrest", Vector3.new(P.PLOT_SIZE, S.backH, 3), at(0, Y + S.backH / 2, -HALF + 1.5), S.legColor, S.mat)
	-- Rampe d'entrée (si elle est à l'envers dans Studio, tourne-la de 180° sur Y)
	wedge(body, "EntryRamp", Vector3.new(20, Y, 14), root * CFrame.new(0, Y / 2, HALF + 7) * CFrame.Angles(0, RAD(180), 0), S.seatColor, S.mat)

	-- Décorations selon le stade
	local deco = model(m, "Decorations")
	if k >= 2 then -- coussin
		part(deco, "Cushion", Vector3.new(30, 1, 30), at(0, Y + 0.5, -4), S.seatColor:Lerp(Color3.new(1, 1, 1), 0.15), Enum.Material.Fabric, { CanCollide = false })
	end
	if k >= 3 then -- accoudoirs
		for _, sx in ipairs({ -1, 1 }) do
			part(deco, "Armrest", Vector3.new(3, 6, 30), at(sx * (HALF - 1.5), Y + 3, -4), S.legColor, S.mat)
		end
	end
	if k >= 4 then -- couronne de pointes dorées sur le dossier
		for i = -4, 4 do
			part(deco, "CrownSpike", Vector3.new(3, 5, 2), at(i * 5, Y + S.backH + 2.5, -HALF + 1.5), C.gold, Enum.Material.Metal)
		end
	end
	if k >= 5 then -- ailes + gemmes violettes
		for _, sx in ipairs({ -1, 1 }) do
			wedge(deco, "Wing", Vector3.new(2, 22, 16), at(sx * (HALF + 1), Y + S.backH - 6, -HALF + 6) * CFrame.Angles(0, 0, RAD(sx * -12)), C.gold, Enum.Material.Metal)
		end
		for i = -2, 2 do
			part(deco, "Gem", Vector3.new(3, 3, 3), at(i * 8, Y + S.backH - 5, -HALF + 3.3), C.neon, Enum.Material.Neon, { Shape = Enum.PartType.Ball })
		end
	end

	-- Torches violettes de chaque côté de l'entrée + panneau du propriétaire
	local zFront = HALF - 1
	for _, sx in ipairs({ -1, 1 }) do
		part(deco, "EntryPost", Vector3.new(3, 22, 3), at(sx * 20, Y + 11, zFront), S.legColor, S.mat)
		local torch = part(deco, "Torch", Vector3.new(2, 1, 2), at(sx * 20, Y + 22.5, zFront), C.neon, Enum.Material.Neon)
		fire(torch, Color3.fromRGB(170, 90, 255), Color3.fromRGB(30, 0, 60), 20, 3)
		light(torch, C.neon, 20, 2)
	end
	local ownerSign = part(m, "OwnerSign", Vector3.new(30, 6, 1), at(0, Y + 19, zFront), C.auraDark, Enum.Material.Metal)
	sign(ownerSign, "Base libre", Enum.NormalId.Back, Color3.fromRGB(200, 150, 255))
	sign(ownerSign, "Base libre", Enum.NormalId.Front, Color3.fromRGB(200, 150, 255))

	-- Emplacements de chaises : ChairSlots/1..N (Pedestal + Collect)
	local slots = model(m, "ChairSlots")
	local idx = 0
	local function addSlot(x, y, z)
		idx = idx + 1
		local s = model(slots, tostring(idx))
		s:SetAttribute("Index", idx)
		local ped = cyl(s, "Pedestal", 4.2, 1, at(x, y + 0.5, z), C.auraDark, Enum.Material.Metal)
		part(s, "Rim", Vector3.new(4.6, 0.2, 4.6), at(x, y + 1.05, z), C.neon, Enum.Material.Neon, { Transparency = 0.6, CanCollide = false })
		local collect = part(s, "Collect", Vector3.new(4, 0.4, 4), at(x, y + 1.3, z), C.neon, Enum.Material.Neon, { Transparency = 0.5, CanCollide = false })
		collect:SetAttribute("SlotIndex", idx)
		s.PrimaryPart = ped
	end
	for _, z in ipairs({ -12, 0 }) do
		for _, x in ipairs(spread(S.perRow, 30)) do addSlot(x, Y, z) end
	end
	-- 2e étage (stades 4 et 5) : dalle à +18, 4 piliers, escalier intérieur, emplacements en plus
	if S.upper > 0 then
		local Y2 = Y + P.FLOOR2_OFFSET
		local up = model(m, "Floor2")
		part(up, "Slab", Vector3.new(P.PLOT_SIZE, 1.5, 17), at(0, Y2 - 0.75, -HALF + 8.5 + 1), S.seatColor, S.mat)
		for _, sx in ipairs({ -1, 1 }) do
			for _, z in ipairs({ -19.5, -5.5 }) do
				part(up, "Pillar", Vector3.new(3, Y2 - Y, 3), at(sx * 19.5, Y + (Y2 - Y) / 2, z), S.legColor, S.mat)
			end
		end
		wedge(up, "Stairs", Vector3.new(4, Y2 - Y, 18), root * CFrame.new(19.5, Y + (Y2 - Y) / 2, 5) * CFrame.Angles(0, RAD(180), 0), S.seatColor, S.mat)
		local xs = spread(S.upper, 21)
		for _, x in ipairs(xs) do addSlot(x, Y2, -12) end
	end

	-- Zones logiques (invisibles) : livraison, vol
	part(m, "DeliveryZone", Vector3.new(48, 17, 14), at(0, Y + 8.5, HALF - 7), C.neon, nil, { Transparency = 1, CanCollide = false, CanQuery = false })
	part(m, "StealZone", Vector3.new(P.PLOT_SIZE, 22, P.PLOT_SIZE), at(0, Y + 11, 0), C.neon, nil, { Transparency = 1, CanCollide = false, CanQuery = false })
	part(m, "Spawn", Vector3.new(6, 0.4, 6), at(0, Y + 0.2, HALF - 10), C.neon, Enum.Material.Neon, { Transparency = 0.8, CanCollide = false })

	-- Barrière de verrouillage : lasers violets entre les deux piliers d'entrée + bouton
	local lock = model(m, "LockBarrier")
	local hit = part(lock, "Hitbox", Vector3.new(38, 14, 1), at(0, Y + 7, zFront), C.neon, Enum.Material.ForceField, { Transparency = 0.7 })
	for i = 0, 4 do
		part(lock, "Laser", Vector3.new(38, 0.35, 0.35), at(0, Y + 1.5 + i * 3, zFront), C.neon, Enum.Material.Neon, { CanCollide = false })
	end
	lock.PrimaryPart = hit
	local btn = cyl(m, "LockButton", 3, 1, at(-16, Y + 0.5, HALF - 6), Color3.fromRGB(255, 60, 120), Enum.Material.Neon)
	btn:SetAttribute("Action", "Lock")

	-- Collecteur d'aura (l'aura gagnée s'y accumule)
	local collector = part(m, "AuraCollector", Vector3.new(12, 0.6, 3), at(0, Y + 0.3, -HALF + 4.5), C.auraDark, Enum.Material.Metal)
	part(collector, "Glow", Vector3.new(10, 0.2, 1.4), collector.CFrame * CFrame.new(0, 0.4, 0), C.neon, Enum.Material.Neon, { CanCollide = false })
	return m
end

-- Gabarits (un par stade) rangés dans ServerStorage pour l'étape 3 (croissance)
local Templates = folder(ServerStorage, "BaseStages")
for k = 1, #STAGES do buildStage(Templates, k, CFrame.new()) end

-- Les 10 plots : stade 1 visible, entrées tournées vers le tapis
local plotIndex = 0
for side = -1, 1, 2 do -- -1 = gauche, +1 = droite
	for i = 1, P.PLOTS_PER_SIDE do
		plotIndex = plotIndex + 1
		local z = (i - (P.PLOTS_PER_SIDE + 1) / 2) * P.PLOT_SPACING
		local x = side * P.PLOT_X
		-- repère local : +Z local (entrée) doit pointer vers le tapis (X=0)
		local root = CFrame.new(x, 0, z) * CFrame.Angles(0, RAD(side == -1 and 90 or -90), 0)
		local plot = model(Plots, "Plot" .. plotIndex)
		plot:SetAttribute("PlotId", plotIndex)
		plot:SetAttribute("Owner", "")
		plot:SetAttribute("Stage", 1)
		plot:SetAttribute("Side", side == -1 and "Left" or "Right")
		local stage1 = buildStage(plot, 1, root)
		plot.PrimaryPart = stage1.PrimaryPart
	end
end

-- Aperçu des 5 stades (hors de la map, au bout) pour les peaufiner à la main
if P.STAGE_PREVIEW then
	local prev = folder(Map, "StagePreview")
	for k = 1, #STAGES do
		local root = CFrame.new((k - 3) * 70, 0, P.FLOOR_L / 2 + 90)
		part(prev, "Pad" .. k, Vector3.new(60, 1, 60), root * CFrame.new(0, -0.5, 0), C.floor, Enum.Material.WoodPlanks)
		buildStage(prev, k, root)
	end
end

---------------------------------------------------------------------------------------------------
-- MURS D'ENCEINTE + STATUES
---------------------------------------------------------------------------------------------------
local Walls = folder(Map, "Walls")
local innerX = P.FLOOR_W / 2 - 2          -- face intérieure des murs latéraux
local innerZ = P.FLOOR_L / 2              -- face intérieure des murs de bout
for _, s in ipairs({ -1, 1 }) do
	part(Walls, "WallSide", Vector3.new(P.WALL_T, P.WALL_H, P.FLOOR_L + 2 * P.WALL_T), CFrame.new(s * (innerX + P.WALL_T / 2), P.WALL_H / 2, 0), C.wall, Enum.Material.Slate)
	part(Walls, "WallTrim", Vector3.new(0.6, 0.6, P.FLOOR_L), CFrame.new(s * (innerX - 0.1), P.WALL_H - 1, 0), C.neon, Enum.Material.Neon, { CanCollide = false })
	part(Walls, "WallEnd", Vector3.new(P.FLOOR_W, P.WALL_H, P.WALL_T), CFrame.new(0, P.WALL_H / 2, s * (innerZ + P.WALL_T / 2)), C.wall, Enum.Material.Slate)
	part(Walls, "WallEndTrim", Vector3.new(P.FLOOR_W - 4, 0.6, 0.6), CFrame.new(0, P.WALL_H - 1, s * (innerZ - 0.1)), C.neon, Enum.Material.Neon, { CanCollide = false })
end

local Statues = folder(Map, "WallStatues")

-- Chaise-statue "sortant" du mur : repère local, le mur est à z=0 (face intérieure), la chaise regarde vers +Z.
-- Seule la moitié avant dépasse du mur, l'arrière est enfoncé dedans.
local function statueBase(parent, name, root, mat, colBody, colTrim)
	local m = model(parent, name)
	local function at(x, y, z) return root * CFrame.new(x, y, z) end
	local seat = part(m, "Seat", Vector3.new(12, 2, 12), at(0, 10, 0), colBody, mat)
	part(m, "Back", Vector3.new(12, 18, 2.5), at(0, 19, -2.5), colBody, mat)
	for _, sx in ipairs({ -1, 1 }) do
		for _, sz in ipairs({ -1, 1 }) do
			part(m, "Leg", Vector3.new(2, 9, 2), at(sx * 5, 4.5, sz * 5), colBody, mat)
		end
	end
	part(m, "Trim", Vector3.new(12.4, 0.6, 12.4), at(0, 11.1, 0), colTrim, Enum.Material.Neon, { CanCollide = false })
	m.PrimaryPart = seat
	-- projecteur au sol, pointé vers la statue
	local spot = part(m, "Spot", Vector3.new(2, 1, 2), at(0, 0.5, 9), C.auraDark, Enum.Material.Metal)
	make("SpotLight", { Color = colTrim, Range = 40, Angle = 70, Brightness = 4, Face = Enum.NormalId.Top }, spot)
	return m, at
end

local function flameStatue(parent, root)
	local m, at = statueBase(parent, "Statue_Flame", root, Enum.Material.Basalt, Color3.fromRGB(40, 20, 15), Color3.fromRGB(255, 120, 30))
	local orange, red = Color3.fromRGB(255, 170, 40), Color3.fromRGB(255, 50, 0)
	-- langues de feu sur le dossier
	for i = -2, 2 do
		local f = wedge(m, "FlameTongue", Vector3.new(2.4, 7 - math.abs(i), 2), at(i * 2.4, 31.5 - math.abs(i) * 0.5, -2.5) * CFrame.Angles(0, RAD(180), 0), orange, Enum.Material.Neon, { CanCollide = false })
	end
	local em = part(m, "FireEmitter", Vector3.new(10, 1, 2), at(0, 29, -2.5), red, Enum.Material.Neon, { Transparency = 1, CanCollide = false })
	fire(em, orange, red, 45, 4)
	embers(em, orange)
	local seatFire = part(m, "SeatFire", Vector3.new(8, 1, 8), at(0, 11.5, 0), red, Enum.Material.Neon, { Transparency = 1, CanCollide = false })
	fire(seatFire, orange, red, 25, 3)
	light(em, orange, 35, 3)
	return m
end

local function dragonStatue(parent, root)
	local green, dark = Color3.fromRGB(40, 110, 60), Color3.fromRGB(20, 55, 35)
	local m, at = statueBase(parent, "Statue_Dragon", root, Enum.Material.Slate, green, Color3.fromRGB(255, 220, 40))
	-- cornes
	for _, sx in ipairs({ -1, 1 }) do
		wedge(m, "Horn", Vector3.new(1.6, 7, 2), at(sx * 4, 31.5, -2.5) * CFrame.Angles(0, RAD(180), RAD(sx * 12)), Color3.fromRGB(230, 220, 190), Enum.Material.Marble)
		-- ailes
		wedge(m, "Wing", Vector3.new(1, 16, 14), at(sx * 10, 22, -4) * CFrame.Angles(0, RAD(180), RAD(sx * 18)), dark, Enum.Material.Slate)
		-- yeux lumineux
		part(m, "Eye", Vector3.new(1.4, 1.4, 1.4), at(sx * 3, 25, -1.1), Color3.fromRGB(255, 230, 40), Enum.Material.Neon, { Shape = Enum.PartType.Ball })
		-- griffes
		part(m, "Claw", Vector3.new(2.4, 1.2, 3), at(sx * 5, 0.6, 6.5), Color3.fromRGB(230, 220, 190), Enum.Material.Marble)
	end
	-- écailles (rangée de petites pointes sur le dossier)
	for i = -3, 3 do
		part(m, "Scale", Vector3.new(1.6, 2, 1.6), at(i * 1.6, 28.5, -2.5), dark, Enum.Material.Slate)
	end
	local eyeLight = part(m, "EyeGlow", Vector3.new(1, 1, 1), at(0, 25, 0), green, Enum.Material.Neon, { Transparency = 1, CanCollide = false })
	light(eyeLight, Color3.fromRGB(255, 230, 40), 25, 2)
	return m
end

local function spaceStatue(parent, root)
	local steel, cyan = Color3.fromRGB(70, 80, 100), Color3.fromRGB(40, 230, 255)
	local m, at = statueBase(parent, "Statue_Space", root, Enum.Material.Metal, steel, cyan)
	-- bandes néon cyan
	for _, sx in ipairs({ -1, 1 }) do
		part(m, "NeonStrip", Vector3.new(0.5, 16, 0.5), at(sx * 5, 19, -1.2), cyan, Enum.Material.Neon, { CanCollide = false })
	end
	part(m, "NeonBand", Vector3.new(12, 0.5, 0.5), at(0, 24, -1.2), cyan, Enum.Material.Neon, { CanCollide = false })
	-- planètes en orbite (placeholders ; la rotation viendra à l'étape VFX)
	local orbit = model(m, "Orbit")
	local p1 = part(orbit, "Planet", Vector3.new(4, 4, 4), at(-8, 33, 2), Color3.fromRGB(230, 120, 60), Enum.Material.SmoothPlastic, { Shape = Enum.PartType.Ball })
	local p2 = part(orbit, "Moon", Vector3.new(2, 2, 2), at(8, 36, 3), Color3.fromRGB(200, 210, 230), Enum.Material.SmoothPlastic, { Shape = Enum.PartType.Ball })
	part(orbit, "Ring", Vector3.new(0.2, 8, 8), at(-8, 33, 2) * CFrame.Angles(0, 0, RAD(70)), cyan, Enum.Material.Neon, { Shape = Enum.PartType.Cylinder, CanCollide = false, Transparency = 0.5 })
	local stars = part(m, "StarEmitter", Vector3.new(12, 1, 4), at(0, 30, 0), cyan, Enum.Material.Neon, { Transparency = 1, CanCollide = false })
	make("ParticleEmitter", { Name = "Etoiles", Texture = "rbxasset://textures/particles/sparkles_main.dds", Color = ColorSequence.new(cyan),
		LightEmission = 1, Rate = 12, Lifetime = NumberRange.new(2, 4), Speed = NumberRange.new(1, 3), Size = sizeSeq(0.8, 0),
		SpreadAngle = Vector2.new(60, 60) }, stars)
	light(stars, cyan, 30, 2)
	return m
end

local builders = { flameStatue, dragonStatue, spaceStatue }
local statueN = 0
local function placeStatue(root)
	statueN = statueN + 1
	builders[(statueN - 1) % 3 + 1](Statues, root)
end
local nSide = P.STATUE_COUNT_SIDE
for i = 1, nSide do
	local z = (i - (nSide + 1) / 2) * P.STATUE_STEP
	placeStatue(CFrame.new(-innerX, 0, z) * CFrame.Angles(0, RAD(90), 0))
	placeStatue(CFrame.new(innerX, 0, z) * CFrame.Angles(0, RAD(-90), 0))
end
local nEnd = P.STATUE_COUNT_END
for i = 1, nEnd do
	local x = (i - (nEnd + 1) / 2) * 45
	placeStatue(CFrame.new(x, 0, -innerZ))
	placeStatue(CFrame.new(x, 0, innerZ) * CFrame.Angles(0, RAD(180), 0))
end

---------------------------------------------------------------------------------------------------
-- BOUTIQUES (couloir gauche, entre les bases du milieu)
---------------------------------------------------------------------------------------------------
local Shops = folder(Map, "Shops")
local SHOP_X = -50

-- Petit PNJ-mannequin (Parts) ; le vrai PNJ animé viendra à l'étape 6
local function vendor(parent, cf, shirt)
	local n = model(parent, "Vendor")
	part(n, "Legs", Vector3.new(2.2, 3, 1.2), cf * CFrame.new(0, 1.5, 0), Color3.fromRGB(30, 30, 40))
	part(n, "Torso", Vector3.new(2.4, 2.6, 1.2), cf * CFrame.new(0, 4.3, 0), shirt)
	part(n, "Head", Vector3.new(1.6, 1.6, 1.6), cf * CFrame.new(0, 6.4, 0), Color3.fromRGB(240, 200, 160), nil, { Shape = Enum.PartType.Ball })
	part(n, "ArmL", Vector3.new(0.9, 2.6, 0.9), cf * CFrame.new(-1.7, 4.3, 0), shirt)
	part(n, "ArmR", Vector3.new(0.9, 2.6, 0.9), cf * CFrame.new(1.7, 4.3, 0), shirt)
	return n
end

local function shopBase(name, z, accent, accent2, title, isRobux)
	local m = model(Shops, name)
	m:SetAttribute("ShopType", isRobux and "Robux" or "Aura")
	local root = CFrame.new(SHOP_X, 0, z) * CFrame.Angles(0, RAD(90), 0) -- regarde vers le tapis (+X)
	local function at(x, y, zz) return root * CFrame.new(x, y, zz) end
	local base = part(m, "Platform", Vector3.new(18, 1, 16), at(0, 0.5, 0), C.auraDark, Enum.Material.Metal)
	m.PrimaryPart = base
	part(m, "Counter", Vector3.new(14, 4, 3), at(0, 3, 4), accent2, Enum.Material.Metal)
	local top = part(m, "CounterTop", Vector3.new(14.5, 0.6, 3.5), at(0, 5.3, 4), accent, Enum.Material.Neon)
	for _, sx in ipairs({ -1, 1 }) do
		part(m, "Pillar", Vector3.new(2, 16, 2), at(sx * 8, 9, -5), accent2, Enum.Material.Metal)
	end
	part(m, "Roof", Vector3.new(19, 1.5, 14), at(0, 17.5, -2), accent2, Enum.Material.Metal)
	local board = part(m, "Sign", Vector3.new(16, 4, 1), at(0, 14, 5.5), C.auraDark, Enum.Material.Metal)
	sign(board, title, Enum.NormalId.Back, accent)
	vendor(m, at(0, 1, -1), accent)
	local spotLight = part(m, "Glow", Vector3.new(1, 1, 1), at(0, 16, 2), accent, Enum.Material.Neon, { Transparency = 1, CanCollide = false })
	light(spotLight, accent, 30, 3)
	return m, at, accent
end

-- Boutique ROBUX : stand doré en forme de trône
do
	local m, at = shopBase("RobuxShop", -70, C.gold, Color3.fromRGB(90, 60, 15), "ROBUX", true)
	part(m, "ThroneBack", Vector3.new(8, 12, 1.5), at(0, 7, -6), C.gold, Enum.Material.Metal)
	part(m, "ThroneSeat", Vector3.new(8, 1.5, 6), at(0, 2, -3), Color3.fromRGB(150, 20, 40), Enum.Material.Fabric)
	for _, sx in ipairs({ -1, 1 }) do
		part(m, "ThroneArm", Vector3.new(1.5, 4, 6), at(sx * 4.8, 3.5, -3), C.gold, Enum.Material.Metal)
	end
	for i = -2, 2 do
		part(m, "Crown", Vector3.new(1.4, 3, 1.4), at(i * 1.8, 13.5, -6), C.gold, Enum.Material.Metal)
	end
	local coins = part(m, "Sparkles", Vector3.new(8, 1, 4), at(0, 12, -3), C.gold, Enum.Material.Neon, { Transparency = 1, CanCollide = false })
	make("ParticleEmitter", { Name = "Etincelles", Texture = "rbxasset://textures/particles/sparkles_main.dds",
		Color = ColorSequence.new(C.gold), LightEmission = 1, Rate = 15, Lifetime = NumberRange.new(1, 2.5),
		Speed = NumberRange.new(2, 4), Size = sizeSeq(1, 0), SpreadAngle = Vector2.new(50, 50) }, coins)
end

-- Boutique AURA : stand noir-violet avec flammes d'aura
do
	local m, at = shopBase("AuraShop", -37, C.neon, Color3.fromRGB(15, 5, 30), "AURA", false)
	for _, sx in ipairs({ -1, 1 }) do
		local brazier = cyl(m, "Brazier", 3, 3, at(sx * 6.5, 2.5, -2), Color3.fromRGB(20, 10, 35), Enum.Material.Metal)
		local f = part(m, "AuraFlameEmitter", Vector3.new(2, 1, 2), at(sx * 6.5, 4.5, -2), C.neon, Enum.Material.Neon, { Transparency = 1, CanCollide = false })
		fire(f, Color3.fromRGB(170, 90, 255), Color3.fromRGB(10, 0, 20), 35, 4)
	end
	local orb = part(m, "AuraOrb", Vector3.new(5, 5, 5), at(0, 9, -2), Color3.fromRGB(70, 20, 130), Enum.Material.Neon, { Shape = Enum.PartType.Ball, CanCollide = false, Transparency = 0.2 })
	fire(orb, Color3.fromRGB(170, 90, 255), Color3.fromRGB(10, 0, 20), 30, 5)
end

---------------------------------------------------------------------------------------------------
-- ROUES (journalière + hebdomadaire), côte à côte
---------------------------------------------------------------------------------------------------
local Wheels = folder(Map, "Wheels")

local function wheel(name, z, radius, segments, colA, colB, rim, title)
	local m = model(Wheels, name)
	m:SetAttribute("Segments", segments)
	local cx, cy = SHOP_X, radius + 6
	local base = part(m, "Stand", Vector3.new(14, 2, radius * 1.4), CFrame.new(cx, 1, z), C.auraDark, Enum.Material.Metal)
	for _, sz in ipairs({ -1, 1 }) do
		part(m, "Support", Vector3.new(2, cy, 2), CFrame.new(cx, cy / 2, z + sz * (radius + 2)), C.auraDark, Enum.Material.Metal)
	end
	-- Le disque tourne autour de l'axe X : on le fera tourner à l'étape 7
	local disc = part(m, "Disc", Vector3.new(2, radius * 2, radius * 2), CFrame.new(cx, cy, z), C.auraDark, Enum.Material.Metal,
		{ Shape = Enum.PartType.Cylinder })
	m.PrimaryPart = disc
	local segs = model(m, "Segments")
	for i = 1, segments do
		local a = (i - 0.5) / segments * math.pi * 2
		local tang = 2 * math.pi * radius * 0.6 / segments
		local col = (i % 2 == 0) and colA or colB
		local seg = part(segs, "Segment" .. i, Vector3.new(0.5, radius * 0.8, tang * 0.9),
			CFrame.new(cx + 1.2, cy, z) * CFrame.Angles(a, 0, 0) * CFrame.new(0, radius * 0.5, 0), col, Enum.Material.Neon)
		seg:SetAttribute("SegmentIndex", i)
	end
	part(m, "Hub", Vector3.new(2.6, 4, 4), CFrame.new(cx + 1, cy, z), rim, Enum.Material.Metal, { Shape = Enum.PartType.Cylinder })
	-- jante lumineuse
	local ring = part(m, "Rim", Vector3.new(0.6, radius * 2 + 1.5, radius * 2 + 1.5), CFrame.new(cx + 0.2, cy, z), rim, Enum.Material.Neon,
		{ Shape = Enum.PartType.Cylinder, Transparency = 0.5, CanCollide = false })
	-- aiguille fixe en haut
	wedge(m, "Pointer", Vector3.new(0.8, 4, 3), CFrame.new(cx + 1.6, cy + radius + 2, z) * CFrame.Angles(0, 0, RAD(180)), Color3.fromRGB(255, 60, 60), Enum.Material.Neon)
	local board = part(m, "Title", Vector3.new(1, 5, 14), CFrame.new(cx + 0.5, cy + radius + 7, z), C.auraDark, Enum.Material.Metal)
	sign(board, title, Enum.NormalId.Right, rim)
	local gl = part(m, "Glow", Vector3.new(1, 1, 1), CFrame.new(cx + 6, cy, z), rim, Enum.Material.Neon, { Transparency = 1, CanCollide = false })
	light(gl, rim, 40, 2.5)
	return m
end
wheel("DailyWheel", 35, 9, 8, Color3.fromRGB(150, 60, 255), Color3.fromRGB(50, 20, 110), Color3.fromRGB(90, 200, 255), "ROUE DU JOUR")
local weekly = wheel("WeeklyWheel", 72, 14, 12, Color3.fromRGB(255, 190, 40), Color3.fromRGB(180, 30, 120), C.gold, "ROUE DE LA SEMAINE")
-- Couronne de flammes pour la roue hebdomadaire (plus épique)
local crown = part(weekly, "CrownFlames", Vector3.new(10, 1, 2), CFrame.new(SHOP_X + 1, 14 + 6 + 14 + 3, 72), C.gold, Enum.Material.Neon, { Transparency = 1, CanCollide = false })
fire(crown, Color3.fromRGB(255, 190, 40), Color3.fromRGB(180, 30, 120), 40, 4)

---------------------------------------------------------------------------------------------------
-- POINT D'APPARITION : au centre, couloir droit, face aux boutiques
---------------------------------------------------------------------------------------------------
for _, o in ipairs(workspace:GetChildren()) do
	if o:IsA("SpawnLocation") then o:Destroy() end -- supprime le spawn par défaut du template
end
make("SpawnLocation", {
	Name = "SpawnLocation", Size = Vector3.new(12, 1, 12), Position = Vector3.new(52, 0.5, 0), Anchored = true,
	Neutral = true, Duration = 0, Material = Enum.Material.Neon, Color = C.neon,
}, workspace)

print(string.format("[MapBuilder] OK : %d parts, %d plots, %d statues. Regarde Workspace > Map.", partCount, plotIndex, statueN))
