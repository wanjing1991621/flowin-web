import { useState } from 'react';
import {
  Lightbulb,
  Wrench,
  Users,
  FileText,
  CalendarDays,
  MoreHorizontal,
} from 'lucide-react';
import { Header } from './social-ui';
import { useAuth } from './auth';
import { supabase } from './supabase';
const feedbackTypes = [
  ['产品建议', Lightbulb],
  ['功能问题 / Bug', Wrench],
  ['用户举报', Users],
  ['需求 / 项目举报', FileText],
  ['活动相关', CalendarDays],
  ['其他问题', MoreHorizontal],
] as const;
export default function Feedback() {
  const { user } = useAuth();
  const [type, setType] = useState(''),
    [content, setContent] = useState(''),
    [contact, setContact] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!type) {
      setError('请选择反馈类型');
      return;
    }
    if (!content.trim()) {
      setError('请告诉我们发生了什么');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          feedback_type: type,
          content: content.trim(),
          contact: contact.trim() || null,
          user_id: user?.id ?? null,
        });
      if (error) throw error;
      setType('');
      setContent('');
      setContact('');
      setSuccess(true);
    } catch (e) {
      console.error('Supabase feedback insert failed:', e);
      setError('提交失败，请稍后再试。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header active="投诉建议" />
      <main className="feedback-page">
        <section className="feedback-content">
          <h1>
            一起，让 FlowIn
            <br />
            变得更好。
          </h1>
          <p>
            FlowIn 还在成长。
            <br />
            你的问题、建议和新的想法，
            <br />
            都会帮助我们不断优化产品，创造更好的体验。
            <br />
            你看到的问题，也许正是下一次升级的开始。
          </p>
          {success ? (
            <div className="feedback-success" role="status">
              <h3>谢谢你的反馈 💧</h3>
              <p>
                我们已经收到。你的每一条建议，都可能成为 FlowIn
                下一次改变的一部分。
              </p>
              <button
                type="button"
                className="secondary"
                onClick={() => setSuccess(false)}
              >
                继续提交反馈
              </button>
            </div>
          ) : (
            <form className="feedback-form" onSubmit={submit}>
              <fieldset>
                <legend>请选择反馈类型：</legend>
                <div className="feedback-types">
                  {feedbackTypes.map(([label, Icon]) => (
                    <button
                      type="button"
                      key={label}
                      className={type === label ? 'selected' : ''}
                      aria-pressed={type === label}
                      onClick={() => setType(label)}
                    >
                      <Icon size={24} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                <strong>告诉我们发生了什么</strong>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={2000}
                  placeholder="请详细描述你的问题或建议……"
                />
                <small>{content.length}/2000</small>
              </label>
              <label>
                <strong>联系方式（选填）</strong>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  maxLength={200}
                  placeholder="邮箱 / 微信 / 其他联系方式"
                />
              </label>
              {error && (
                <p className="feedback-error" role="alert">
                  {error}
                </p>
              )}
              <button className="primary feedback-submit" disabled={busy}>
                {busy ? '提交中…' : '提交反馈　→'}
              </button>
            </form>
          )}
          <footer>FlowIn · 恣优　｜　AI时代的人才与机会社区</footer>
        </section>
      </main>
    </>
  );
}
