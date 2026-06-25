// ══════════════════════════════════════════════════════════════════
//  ACTION PLUMBING — FLEET MAINTENANCE TRACKER
//  checklists.js   ·   crews, checklist templates, compliance helpers
//  include AFTER firebase-config.js, BEFORE page scripts
// ══════════════════════════════════════════════════════════════════
//
//  TO EDIT A CHECKLIST: find the section below and add/remove items.
//  Each item is { id, label } and optionally critical:true (a critical
//  defect = the rig is RED / out-of-service until fixed).
// ══════════════════════════════════════════════════════════════════

const CREWS = {
    underground: {
        id: 'underground',
        label: 'Underground',
        sub: 'Excavation & Sewer',
        glyph: '⛏',
        cadence: 'daily',          // checks required EVERY day
        hauls: true,               // hauls trailer + excavator
        accent: '#f59e0b'          // amber — earth/dig
    },
    plumbing: {
        id: 'plumbing',
        label: 'Plumbing Install',
        sub: 'Service & Install',
        glyph: '🔧',
        cadence: 'weekly',         // due every Monday
        hauls: false,
        accent: '#dc2626'          // red — house color
    },
    hvac: {
        id: 'hvac',
        label: 'HVAC Install',
        sub: 'Heating & Cooling',
        glyph: '❄',
        cadence: 'weekly',
        hauls: false,
        accent: '#38bdf8'          // sky
    },
    electrical: {
        id: 'electrical',
        label: 'Electrical Install',
        sub: 'Wiring & Panels',
        glyph: '⚡',
        cadence: 'weekly',
        hauls: false,
        accent: '#a855f7'          // violet
    }
};
const CREW_ORDER = ['underground', 'plumbing', 'hvac', 'electrical'];

// ── DAILY DVIR (underground, every day) ──────────────────────────────
// FMCSA 49 CFR 396.11 / 392.7 — the 11 required components, plus trailer
// and excavator securement under 49 CFR 393.130.
const DAILY_DVIR = [
    {
        id: 'truck',
        title: 'Truck — Pre-Trip (DOT 11-Point)',
        items: [
            { id: 'service_brakes',   label: 'Service brakes hold & feel firm', critical: true },
            { id: 'parking_brake',    label: 'Parking / hand brake holds',       critical: true },
            { id: 'steering',         label: 'Steering — no excess play',        critical: true },
            { id: 'lights',           label: 'Lights & reflectors (head, tail, brake, signal, marker)' },
            { id: 'tires',            label: 'Tires — tread, sidewall, pressure', critical: true },
            { id: 'horn',             label: 'Horn works' },
            { id: 'wipers',           label: 'Windshield clear & wipers work' },
            { id: 'mirrors',          label: 'Mirrors clean & adjusted' },
            { id: 'wheels',           label: 'Wheels, rims & lug nuts tight',     critical: true },
            { id: 'coupling',         label: 'Hitch / pintle & safety chains',    critical: true },
            { id: 'emergency',        label: 'Fire extinguisher, triangles, spare fuses' },
            { id: 'leaks',            label: 'No leaks / puddles under truck' }
        ]
    },
    {
        id: 'trailer',
        title: 'Trailer',
        items: [
            { id: 't_tires',     label: 'Trailer tires & wheels good',       critical: true },
            { id: 't_brakes',    label: 'Trailer brakes & breakaway cable',  critical: true },
            { id: 't_lights',    label: 'Trailer lights & 7-pin connection' },
            { id: 't_coupler',   label: 'Coupler latched, safety chains crossed', critical: true },
            { id: 't_deck',      label: 'Deck & ramps — no damage' },
            { id: 't_frame',     label: 'Frame & welds — no cracks' }
        ]
    },
    {
        id: 'securement',
        title: 'Excavator Securement (DOT §393.130)',
        haulOnly: true,   // only required when hauling the machine
        items: [
            { id: 's_fourpoint', label: '4+ chains at independent corners (frame/track only)', critical: true },
            { id: 's_wll',       label: 'Chain WLL adds up to ≥ ½ machine weight', critical: true },
            { id: 's_binders',   label: 'Binders locked & secured',          critical: true },
            { id: 's_bucket',    label: 'Bucket/arm lowered & secured separately', critical: true },
            { id: 's_lock',      label: 'Swing lock + house lock engaged' },
            { id: 's_chains',    label: 'Chains & binders — no wear or damage', critical: true },
            { id: 's_loose',     label: 'No loose ends flapping; tracks chocked if needed' }
        ]
    }
];

// ── WEEKLY MAINTENANCE (ALL crews, due Monday) ───────────────────────
// "At least once a week check all fluids" + running gear + safety/docs.
const WEEKLY_MAINT = [
    {
        id: 'fluids',
        title: 'Fluids',
        items: [
            { id: 'engine_oil',  label: 'Engine oil level' },
            { id: 'coolant',     label: 'Coolant / antifreeze' },
            { id: 'brake_fluid', label: 'Brake fluid', critical: true },
            { id: 'power_steer', label: 'Power steering fluid' },
            { id: 'washer',      label: 'Windshield washer fluid' },
            { id: 'trans',       label: 'Transmission fluid (if checkable)' }
        ]
    },
    {
        id: 'running_gear',
        title: 'Running Gear',
        items: [
            { id: 'w_tires',   label: 'Tire tread depth & pressure — all', critical: true },
            { id: 'w_brakes',  label: 'Brakes — pads / no grinding',       critical: true },
            { id: 'w_battery', label: 'Battery & terminals clean' },
            { id: 'w_belts',   label: 'Belts & hoses — no cracks' },
            { id: 'w_lights',  label: 'All exterior lights work' },
            { id: 'w_wipers',  label: 'Wiper blades good' },
            { id: 'w_leaks',   label: 'No leaks under vehicle' }
        ]
    },
    {
        id: 'safety_docs',
        title: 'Safety & Documents',
        items: [
            { id: 'd_horn',  label: 'Horn & mirrors' },
            { id: 'd_body',  label: 'Body / glass — no new damage' },
            { id: 'd_reg',   label: 'Registration & insurance in vehicle' },
            { id: 'd_fire',  label: 'Fire extinguisher charged' },
            { id: 'd_aid',   label: 'First aid kit stocked' },
            { id: 'd_clean', label: 'Cab clean & organized' }
        ]
    }
];

// Map a run type -> its template
function templateFor(runType) {
    return runType === 'daily' ? DAILY_DVIR : WEEKLY_MAINT;
}

// ── DATE / COMPLIANCE HELPERS ────────────────────────────────────────
function dateKey(d) {
    d = d || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function prettyDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US',
        { weekday: 'short', month: 'short', day: 'numeric' });
}
// Monday of the current week (local), as a YYYY-MM-DD key
function weekStartKey(d) {
    d = d || new Date();
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dow = copy.getDay();                 // 0 Sun … 6 Sat
    const back = dow === 0 ? 6 : dow - 1;      // days since Monday
    copy.setDate(copy.getDate() - back);
    return dateKey(copy);
}

// inspections: the object stored at fleet/inspections/{empId}
// returns: { status:'cleared'|'overdue'|'notdue', lastKey, label, critical:bool }
function complianceFor(emp, inspections) {
    inspections = inspections || {};
    const crew = CREWS[emp.crew];
    const today = dateKey();

    // gather daily + weekly run dates present
    const keys = Object.keys(inspections).sort();          // ascending date keys
    const dailyKeys  = keys.filter(k => inspections[k] && inspections[k].daily);
    const weeklyKeys = keys.filter(k => inspections[k] && inspections[k].weekly);

    if (crew.cadence === 'daily') {
        const doneToday = dailyKeys.includes(today);
        const crit = doneToday && inspections[today].daily.criticalCount > 0;
        if (doneToday) return { status: 'cleared', lastKey: today, label: 'Cleared today', critical: crit };
        const last = dailyKeys.length ? dailyKeys[dailyKeys.length - 1] : null;
        return { status: 'overdue', lastKey: last,
                 label: last ? 'Last: ' + prettyDate(last) : 'Never checked', critical: false };
    }

    // weekly crews — due since Monday
    const monday = weekStartKey();
    const doneThisWeek = weeklyKeys.filter(k => k >= monday);
    if (doneThisWeek.length) {
        const k = doneThisWeek[doneThisWeek.length - 1];
        const crit = inspections[k].weekly.criticalCount > 0;
        return { status: 'cleared', lastKey: k, label: 'Done ' + prettyDate(k), critical: crit };
    }
    const last = weeklyKeys.length ? weeklyKeys[weeklyKeys.length - 1] : null;
    return { status: 'overdue', lastKey: last,
             label: last ? 'Last: ' + prettyDate(last) : 'Never checked', critical: false };
}

// ══════════════════════════════════════════════════════════════════
//  FLEET ASSETS, COMPLIANCE DATES, PREVENTIVE MAINTENANCE
// ══════════════════════════════════════════════════════════════════

const ASSET_TYPES = {
    truck:     { label:'Truck',     glyph:'🚚', docs:true  },
    van:       { label:'Van',       glyph:'🚐', docs:true  },
    trailer:   { label:'Trailer',   glyph:'🚛', docs:false },
    excavator: { label:'Excavator', glyph:'⛏',  docs:false }
};
const ASSET_TYPE_ORDER = ['truck','van','trailer','excavator'];

// which asset types each crew selects when running a check
const CREW_ASSET_TYPES = {
    underground: ['truck','trailer','excavator'],
    plumbing:    ['truck','van'],
    hvac:        ['truck','van'],
    electrical:  ['truck','van']
};

// label like "Truck 14 · F-450 Dually"
function assetLabel(a){
    if(!a) return '—';
    const t=ASSET_TYPES[a.type]||{label:a.type};
    return t.label + (a.number?(' '+a.number):'') + (a.name?(' · '+a.name):'');
}

// ── expiration helpers (registration, insurance, DOT inspection, CDL, med card) ──
function daysUntil(dateStr){
    if(!dateStr) return null;
    const [y,m,d]=dateStr.split('-').map(Number);
    const target=new Date(y,m-1,d); target.setHours(0,0,0,0);
    const today=new Date(); today.setHours(0,0,0,0);
    return Math.round((target-today)/86400000);
}
// warnDays default 30 → "soon"
function expiryStatus(dateStr, warnDays){
    warnDays=warnDays||30;
    if(!dateStr) return { status:'none', days:null };
    const d=daysUntil(dateStr);
    if(d<0)         return { status:'expired', days:d };
    if(d<=warnDays) return { status:'soon',    days:d };
    return { status:'ok', days:d };
}

// ── preventive maintenance by mileage/hours ──────────────────────────
// latest odometer/hours seen for an asset across all inspections
function assetOdometer(assetId, allInspections){
    let max=0;
    Object.values(allInspections||{}).forEach(days=>{
        Object.values(days||{}).forEach(day=>{
            ['daily','weekly'].forEach(rt=>{
                const r=day[rt];
                if(r && r.truckId===assetId && r.odometer!=null){
                    const o=parseInt(r.odometer,10);
                    if(!isNaN(o) && o>max) max=o;
                }
            });
        });
    });
    return max;
}
// returns { status:'ok'|'soon'|'due'|'none', milesLeft, currentOdo }
function pmStatus(asset, currentOdo){
    const interval=parseInt(asset.pmIntervalMiles,10);
    if(!interval) return { status:'none' };
    const last=parseInt(asset.pmLastServiceMiles||0,10)||0;
    if(!currentOdo || currentOdo<last) return { status:'ok', milesLeft:interval, currentOdo };
    const left=interval-(currentOdo-last);
    if(left<=0)  return { status:'due',  milesLeft:left, currentOdo };
    const buffer=Math.max(500, Math.round(interval*0.1));
    if(left<=buffer) return { status:'soon', milesLeft:left, currentOdo };
    return { status:'ok', milesLeft:left, currentOdo };
}
