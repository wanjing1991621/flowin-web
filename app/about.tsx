import { Compass, UserRound, Users, ChartNoAxesCombined } from 'lucide-react';
import { Header } from './social-ui';
const steps = [
  ['发现可以做的事', Compass],
  ['被看见', UserRound],
  ['与人连接', Users],
  ['找到自己的下一步', ChartNoAxesCombined],
];
export default function About() {
  return (
    <>
      <Header active="关于我们" />
      <main className="story-page">
        <section className="story-content">
          <h1>
            AI 正在改变
            <br />
            工作的方式。
          </h1>
          <p>
            我们相信，未来的职业不一定只有一条固定的路径。
            <br />
            全职工作、项目合作、自由职业、个人创造，以及人与人之间基于能力产生的连接，
            <br />
            都可以成为工作的组成部分。
          </p>
          <h2>恣优 FlowIn 希望成为 AI 时代的人才与机会社区。</h2>
          <p>
            在这里，你可以发现工作与项目机会，也可以发布自己的需求；
            <br />
            可以认识不同领域的人，也可以通过自己的主页、经历与分享，让更多人了解你是谁、
            <br />
            你擅长什么、你正在寻找什么。
          </p>
          <h2>FlowIn 想解决的，不只是“找到一份工作”。</h2>
          <p>我们希望帮助每个人：</p>
          <div className="story-steps">
            {steps.map(([label, Icon], index) => (
              <div key={String(label)}>
                {index > 0 && <span>→</span>}
                <div>
                  <i>
                    <Icon size={27} />
                  </i>
                  <strong>{String(label)}</strong>
                </div>
              </div>
            ))}
          </div>
          <p>
            我们不希望把自由职业理解成“更便宜的劳动”，
            <br />
            也不希望把项目制工作变成没有保障的低价兼职。
            <br />
            我们更希望看到一种新的可能：
          </p>
          <blockquote>
            让人的专业能力自由流动，让人与机会更自然地相遇。
          </blockquote>
          <p>AI 时代，工作的边界正在发生变化。</p>
          <footer>FlowIn · 恣优　｜　AI时代的人才与机会社区</footer>
        </section>
      </main>
    </>
  );
}
