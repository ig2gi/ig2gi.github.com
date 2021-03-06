

const softSkills =  {
    
    "problem solving": [
        "Analysis",
        "Lateral thinking",
        "Logical reasoning",
        "Initiative",
        "Persistence",
        "Observation",
        "Persuasion",
        "Negotiation",
        "Brainstorming",
        "Decision making"
    ],
    "team work": [
        "Conflict management",
        "Delegation",
        "Listening",
        "Active listening",
        "Collaboration",
        "Cooperation",
        "Coordination",
        "Idea exchange",
        "Mediation",
        "Negotiating"
    ],
    "adaptability": [
        "Curiosity",
        "Self-management",
        "Decision-making",
        "Calmness",
        "Optimism",
        "Open-mindedness",
        "Analysis",
        "Self-confidence",
        "Organization",
        "Self-motivation"
    ],
    "communication": [
        "Clarity",
        "Confidence",
        "Respect",
        "Empathy",
        "Listening",
        "Verbal communication",
        "Non-verbal communication",
        "Written communication",
        "Constructive feedback",
        "Friendliness"
    ],
    "creativity": [
        "Divergent thinking",
        "Inspiration",
        "Imagination",
        "Reframing",
        "Mind mapping",
        "Insight",
        "Innovation",
        "Experimenting",
        "Questioning",
        "Design"
    ],
    "work ethic": [
        "Integrity",
        "Responsibility",
        "Discipline",
        "Initiative",
        "Dependability",
        "Commitment",
        "Self-motivated",
        "Professionalism",
        "Teamwork",
        "Time-management"
    ],
    "interpersonal skills": [
        "Empathy",
        "Humor",
        "Mentoring",
        "Networking",
        "Sensitivity",
        "Patience",
        "Tolerance",
        "Public speaking",
        "Positive reinforcement",
        "Diplomacy"
    ],
    "time management": [
        "Goal setting",
        "Prioritizing",
        "Self-starter",
        "Planning",
        "Decision making",
        "Focus",
        "Delegation",
        "Stress management",
        "Coping",
        "Organization"
    ],
    "leadership": [
        "Project management",
        "Empathy",
        "Selflessness",
        "Agility",
        "Listening",
        "Humility",
        "Cultural intelligence",
        "Authenticity",
        "Versatility",
        "Generosity",
        "Trust"
    ],
    "attention to detail": [
        "Critical observation",
        "Listening",
        "Organization",
        "Scheduling",
        "Analysis",
        "Introspection",
        "Memory",
        "Acuity",
        "Recall",
        "Questioning"
    ]
};

const clean = (s) => s.trim().replace(" ", "").replace("-", "").toLowerCase();

export default {

    getTraits: function (){
        return Object.keys(softSkills);
    },

    getFeatures: function(trait){
        return softSkills[trait];
    },

    hasFeature: function(trait, feature){
        let featuresTrait = this.getFeatures(trait);
        let s1 = clean(feature);
        return featuresTrait.find(s => clean(s) === s1) !== undefined;
    },

    getFeatureTraits(feature){
        const found = [];
        this.getTraits().forEach( t => {
            if (this.hasFeature(t, feature))
            found.push(t);
        });
        return found;
    }

   



};
