import { ArrowRight, Boxes, Database, FileCode2, Network, ShieldCheck, TerminalSquare } from "lucide-react";

const agents = ["Internal agents", "3rd-party agents", "User-facing agents"];
const resources = ["Payment APIs", "Data stores", "Cloud tools"];
const engines = ["Policy engine", "Context engine", "Risk scoring", "Audit trail"];

export function ArchitectureSection() {
  return (
    <section className="section architecture-section" id="architecture">
      <div className="section-inner architecture-grid">
        <div className="architecture-copy">
          <p className="eyebrow-label">Architecture</p>
          <h2 className="section-h2">A policy kernel built for the agent era.</h2>
          <p className="section-p">
            Agents keep their autonomy, but every sensitive action is converted into an intent and checked before
            it can reach money, data, infrastructure, or external APIs.
          </p>
          <a className="inline-link" href="#code">
            Explore integration <ArrowRight aria-hidden="true" size={15} />
          </a>
        </div>

        <div className="architecture-map" aria-label="Limitrum runtime architecture">
          <div className="map-lane">
            <div className="map-title">
              <Boxes aria-hidden="true" size={16} />
              Agents
            </div>
            {agents.map((item) => (
              <div className="map-node" key={item}>
                <TerminalSquare aria-hidden="true" size={15} />
                {item}
              </div>
            ))}
          </div>

          <div className="map-arrows" aria-hidden="true">
            <ArrowRight size={18} />
            <ArrowRight size={18} />
            <ArrowRight size={18} />
          </div>

          <div className="kernel-box">
            <div className="kernel-box-title">
              <ShieldCheck aria-hidden="true" size={18} />
              Limitrum Policy Kernel
            </div>
            <div className="engine-grid">
              {engines.map((item) => (
                <div className="engine-cell" key={item}>
                  {item}
                </div>
              ))}
            </div>
            <div className="policy-store">
              <FileCode2 aria-hidden="true" size={15} />
              JSON, YAML, Rego, OPA bundle
            </div>
          </div>

          <div className="map-arrows map-arrows-right" aria-hidden="true">
            <ArrowRight size={18} />
            <ArrowRight size={18} />
            <ArrowRight size={18} />
          </div>

          <div className="map-lane">
            <div className="map-title">
              <Network aria-hidden="true" size={16} />
              Resources
            </div>
            {resources.map((item, index) => (
              <div className="map-node" key={item}>
                {index === 1 ? <Database aria-hidden="true" size={15} /> : <Network aria-hidden="true" size={15} />}
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
