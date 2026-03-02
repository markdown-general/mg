Algebraic effects are initial algebras - you define effects by their operations (constructors):
haskelldata EffF r = Get (Int -> r) | Put Int r
type Eff = Free EffF
A hyperfunction effects system would be final coalgebras - you define effects by their observations (destructors):
haskelltype HyperEff obs a = obs -> a
-- Effects are observation protocols

