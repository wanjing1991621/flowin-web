import { useEffect, useState } from 'react';
import {
  Share2,
  PenLine,
  MapPin,
  BriefcaseBusiness,
  Upload,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  supabase,
  ensureProfile,
  skillList,
  profileUrl,
  profilesFor,
  isHiddenTestUser,
  type PublicProfile,
  type Post,
} from './supabase';
import { useAuth } from './auth';
import { Header, Avatar, PostCard } from './social-ui';
import { ChatButton, RequirementsFeed } from './requirements';
const blank = {
  name: '',
  headline: '',
  bio: '',
  city: '',
  skills: '',
  avatar_url: '',
  xiaohongshu_url: '',
  bilibili_url: '',
  jike_url: '',
  wechat_id: '',
  wechat_qr_url: '',
  wechat_public: false,
};
type ProfileAttachment = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};
function FollowList({ ids }: { ids: string[] }) {
  const [items, setItems] = useState<Record<string, PublicProfile>>({});
  useEffect(() => {
    profilesFor(ids)
      .then(setItems)
      .catch(() => {});
  }, [ids.join(',')]);
  return (
    <div className="member-list">
      {ids.map((id) => {
        const p = items[id];
        return (
          <div className="member-row" key={id}>
            <a href={profileUrl(id)}>
              <Avatar profile={p} />
            </a>
            <div>
              <a href={profileUrl(id)}>
                <strong>{p?.name || '伙伴'}</strong>
              </a>
              <span>{p?.headline}</span>
            </div>
            <a href={profileUrl(id)}>主页</a>
          </div>
        );
      })}
      {!ids.length && <p>暂时还没有伙伴。</p>}
    </div>
  );
}
export default function Profile({ userId }: { userId?: string }) {
  const { user, ready, openAuth, requireUser } = useAuth();
  const id = userId || user?.id,
    own = !!id && user?.id === id;
  const [profile, setProfile] = useState<PublicProfile | null>(null),
    [posts, setPosts] = useState<Post[]>([]),
    [attachments, setAttachments] = useState<ProfileAttachment[]>([]),
    [draft, setDraft] = useState(blank),
    [postDraft, setPostDraft] = useState(''),
    [journeyOpen, setJourneyOpen] = useState(false),
    [journey, setJourney] = useState({
      time: '',
      project: '',
      details: '',
      attachmentUrl: '',
      attachmentName: '',
    }),
    [following, setFollowing] = useState<any[]>([]),
    [followers, setFollowers] = useState<any[]>([]),
    [followOpen, setFollowOpen] = useState<'following' | 'followers' | null>(
      null,
    ),
    [editing, setEditing] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [attachmentBusy, setAttachmentBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [wechatOpen, setWechatOpen] = useState(false),
    [tab, setTab] = useState('动态');
  useEffect(() => {
    let alive = true;
    if (!id) {
      setLoading(false);
      return;
    }
    if (isHiddenTestUser(id)) {
      setProfile(null);
      setPosts([]);
      setFollowing([]);
      setFollowers([]);
      setAttachments([]);
      setError('该用户资料已移除。');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    async function load() {
      try {
        if (own && user) await ensureProfile(user);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        const result = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', id)
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        const [outgoing, incoming, attachmentResult] = await Promise.all([
          supabase.from('follows').select('*').eq('follower_id', id),
          supabase.from('follows').select('*').eq('following_id', id),
          supabase
            .from('profile_attachments')
            .select('*')
            .eq('user_id', id)
            .order('created_at', { ascending: false }),
        ]);
        if (
          result.error ||
          outgoing.error ||
          incoming.error
        )
          throw (
            result.error ||
            outgoing.error ||
            incoming.error
          );
        if (attachmentResult.error)
          console.error('Profile attachments load failed', attachmentResult.error);
        if (alive) {
          setProfile(data);
          setPosts(result.data ?? []);
          setFollowing((outgoing.data ?? []).filter(f=>!isHiddenTestUser(f.following_id)));
          setFollowers((incoming.data ?? []).filter(f=>!isHiddenTestUser(f.follower_id)));
          setAttachments(attachmentResult.error ? [] : (attachmentResult.data ?? []));
        }
      } catch {
        if (alive) setError('主页暂时无法读取，或该用户尚未建立公开资料。');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id, own]);
  async function toggleFollow() {
    try {
      const current = await requireUser();
      if (!current || !id || current.id === id) return;
      const existing = followers.find((f) => f.follower_id === current.id);
      const query = existing
        ? supabase.from('follows').delete().eq('id', existing.id)
        : supabase
            .from('follows')
            .insert({ follower_id: current.id, following_id: id });
      const { error } = await query;
      if (error) throw error;
      const [out, incoming] = await Promise.all([
        supabase.from('follows').select('*').eq('follower_id', id),
        supabase.from('follows').select('*').eq('following_id', id),
      ]);
      setFollowing(out.data ?? []);
      setFollowers(incoming.data ?? []);
    } catch (e) {
      console.error(e);
      setError('关注状态更新失败，请稍后重试。');
    }
  }
  async function storeProfileAttachment(file?: File) {
    if (!file || attachmentBusy) return null;
    if (file.size > 20 * 1024 * 1024) {
      setError('附件请控制在 20MB 以内。');
      return null;
    }
    setAttachmentBusy(true);
    setError('');
    try {
      const current = await requireUser();
      if (!current || current.id !== id) return null;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
      const filePath = `${current.id}/${crypto.randomUUID()}-${safeName}`;
      const upload = await supabase.storage
        .from('profile-attachments')
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        });
      if (upload.error) throw upload.error;
      const fileUrl = supabase.storage
        .from('profile-attachments')
        .getPublicUrl(filePath).data.publicUrl;
      const inserted = await supabase
        .from('profile_attachments')
        .insert({
          user_id: current.id,
          file_name: file.name,
          file_url: fileUrl,
          file_path: filePath,
          file_type: file.type || null,
          file_size: file.size,
        })
        .select()
        .single();
      if (inserted.error) {
        await supabase.storage.from('profile-attachments').remove([filePath]);
        throw inserted.error;
      }
      setAttachments((items) => [inserted.data, ...items]);
      setNotice('附件已上传。');
      return inserted.data as ProfileAttachment;
    } catch (e) {
      console.error('Profile attachment upload failed', e);
      setError('附件上传失败，请稍后重试。');
      return null;
    } finally {
      setAttachmentBusy(false);
    }
  }
  async function deleteProfileAttachment(item: ProfileAttachment) {
    const current = await requireUser();
    if (!current || current.id !== id || item.user_id !== current.id) return;
    setAttachmentBusy(true);
    setError('');
    try {
      const storageResult = await supabase.storage
        .from('profile-attachments')
        .remove([item.file_path]);
      if (storageResult.error) throw storageResult.error;
      const databaseResult = await supabase
        .from('profile_attachments')
        .delete()
        .eq('id', item.id)
        .eq('user_id', current.id);
      if (databaseResult.error) throw databaseResult.error;
      setAttachments((items) => items.filter((entry) => entry.id !== item.id));
      setNotice('附件已删除。');
    } catch (e) {
      console.error('Profile attachment delete failed', e);
      setError('附件删除失败，请稍后重试。');
    } finally {
      setAttachmentBusy(false);
    }
  }
  const isFollowing =
    !!user && followers.some((f) => f.follower_id === user.id);
  const mutual =
    !!user && isFollowing && following.some((f) => f.following_id === user.id);
  function edit() {
    if (!own || !profile) return;
    setDraft({
      name: profile.name || '',
      headline: profile.headline || '',
      bio: profile.bio || '',
      city: profile.city || '',
      skills: skillList(profile.skills).join('、'),
      avatar_url: profile.avatar_url || '',
      xiaohongshu_url: profile.xiaohongshu_url || '',
      bilibili_url: profile.bilibili_url || '',
      jike_url: profile.jike_url || '',
      wechat_id: profile.wechat_id || '',
      wechat_qr_url: profile.wechat_qr_url || '',
      wechat_public: !!profile.wechat_public,
    });
    setError('');
    setEditing(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const current = await requireUser();
      if (!current || current.id !== id) return;
      if (
        draft.avatar_url &&
        !/^(https:\/\/|data:image\/)/i.test(draft.avatar_url)
      )
        throw new Error('头像格式不正确。');
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...draft,
          name: draft.name.trim(),
          skills: skillList(draft.skills),
        })
        .eq('id', current.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      setEditing(false);
      setNotice('资料已保存');
    } catch (e) {
      console.error(e);
      setError('保存未成功，请检查头像链接后重试。内容仍保留。');
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(
        window.location.origin + profileUrl(id!),
      );
      setNotice('主页链接已复制');
    } catch {
      setNotice('请复制浏览器地址栏中的主页链接。');
    }
  }
  async function publishJourney(e: React.FormEvent) {
    e.preventDefault();
    if (
      !journey.time.trim() ||
      !journey.project.trim() ||
      !journey.details.trim()
    ) {
      setError('请填写时间、项目和经历详情。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const current = await requireUser();
      if (!current || current.id !== id) return;
      const attachment = journey.attachmentUrl
        ? `\n【经历附件】${encodeURIComponent(journey.attachmentName)}|${journey.attachmentUrl}`
        : '';
      const content = `【时光长廊】${journey.time.trim()}｜${journey.project.trim()}\n${journey.details.trim()}${attachment}`;
      const { data, error } = await supabase
        .from('posts')
        .insert({ user_id: current.id, content, status: 'published' })
        .select()
        .single();
      if (error) throw error;
      setPosts((v) => [data, ...v]);
      setJourney({
        time: '',
        project: '',
        details: '',
        attachmentUrl: '',
        attachmentName: '',
      });
      setJourneyOpen(false);
      setNotice('经历已添加');
    } catch (e) {
      console.error(e);
      setError('经历保存未成功，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }
  async function uploadJourneyAttachment(file?: File) {
    if (!file) return;
    const allowedExtensions = [
      'pdf',
      'doc',
      'docx',
      'ppt',
      'pptx',
      'xls',
      'xlsx',
      'txt',
      'zip',
    ];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(extension)) {
      setError('附件支持 PDF、Word、PPT、Excel、TXT 或 ZIP 文件。');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('项目附件请控制在 20MB 以内。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const current = await requireUser();
      if (!current || current.id !== id) return;
      const attachment = await storeProfileAttachment(file);
      if (!attachment) return;
      setJourney((value) => ({
        ...value,
        attachmentUrl: attachment.file_url,
        attachmentName: attachment.file_name,
      }));
      setNotice('附件已上传，请保存经历。');
    } catch (e) {
      console.error(e);
      setError('附件上传失败，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }
  async function publishPost() {
    const text = postDraft.trim();
    if (!text || busy) return;
    setBusy(true);
    setError('');
    try {
      const current = await requireUser();
      if (!current || current.id !== id) return;
      const { data, error } = await supabase
        .from('posts')
        .insert({ user_id: current.id, content: text, status: 'published' })
        .select()
        .single();
      if (error) throw error;
      setPosts((v) => [data, ...v]);
      setPostDraft('');
      setNotice('发布成功');
    } catch (e) {
      console.error(e);
      setError('动态发布未成功，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }
  async function uploadWechatQr(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('请选择 JPG、PNG 或 WEBP 图片。');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('二维码图片请控制在 5MB 以内。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const current = await requireUser();
      if (!current) return;
      const path =
        current.id +
        '/wechat-' +
        Date.now() +
        '.' +
        (file.name.split('.').pop() || 'png');
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      let imageUrl = '';
      if (!uploadError) {
        imageUrl = supabase.storage.from('avatars').getPublicUrl(path)
          .data.publicUrl;
      } else {
        console.warn(
          'Supabase Storage QR upload failed; using an embedded profile image.',
          uploadError,
        );
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      setDraft((v) => ({ ...v, wechat_qr_url: imageUrl }));
      setNotice('二维码已上传，请保存资料。');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : '二维码图片读取失败。');
    } finally {
      setBusy(false);
    }
  }
  async function uploadAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件。');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('头像图片请控制在 2MB 以内。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setDraft((v) => ({ ...v, avatar_url: image }));
      setNotice('头像已选好，请保存资料。');
    } catch (e) {
      console.error(e);
      setError('头像读取未成功，请重新选择。');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="profile-page">
      <Header active="我" />
      <main className="wrap profile-main">
        {!ready || loading ? (
          <p role="status">正在读取主页…</p>
        ) : !id ? (
          <section className="community-panel">
            <h1>我的主页</h1>
            <p>登录后完善资料，与伙伴分享动态。</p>
            <button className="primary" onClick={() => openAuth()}>
              登录 / 注册
            </button>
          </section>
        ) : !profile ? (
          <p role="alert">{error || '未找到这个用户。'}</p>
        ) : (
          <>
            <section className="profile-cover">
              <div className="profile-identity">
                <a
                  href={profileUrl(id)}
                  className="profile-portrait real-portrait"
                  aria-label={profile.name + '的主页'}
                >
                  <Avatar profile={profile} />
                </a>
                <div>
                  <div className="profile-name">
                    <h1>
                      <a href={profileUrl(id)}>{profile.name || '新伙伴'}</a>
                    </h1>
                  </div>
                  <p>
                    {[profile.headline, profile.city]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p className="plain-content">
                    {profile.bio || '还没有填写个人简介。'}
                  </p>
                  {own && (
                    <button className="profile-edit-link" onClick={edit}>
                      <PenLine size={13} />
                      编辑资料
                    </button>
                  )}
                </div>
              </div>
              <div className="profile-social">
                {profile.xiaohongshu_url && (
                  <a target="_blank" href={profile.xiaohongshu_url}>
                    小红书
                  </a>
                )}
                {profile.bilibili_url && (
                  <a target="_blank" href={profile.bilibili_url}>
                    B站
                  </a>
                )}
                {profile.jike_url && (
                  <a target="_blank" href={profile.jike_url}>
                    即刻
                  </a>
                )}
                {(own || profile.wechat_public) &&
                  (profile.wechat_id || profile.wechat_qr_url) && (
                    <button onClick={() => setWechatOpen(true)}>微信</button>
                  )}
              </div>
              <div className="profile-cover-bottom">
                <div className="profile-stats">
                  <button onClick={() => setTab('动态')}>
                    <strong>{posts.length}</strong>动态
                  </button>
                  <button onClick={() => setFollowOpen('following')}>
                    <strong>{following.length}</strong>关注
                  </button>
                  <button onClick={() => setFollowOpen('followers')}>
                    <strong>{followers.length}</strong>粉丝
                  </button>
                </div>
                <div className="profile-cover-actions">
                  <button onClick={share}>
                    <Share2 size={16} />
                    分享主页
                  </button>
                  {own ? (
                    <button onClick={edit}>编辑资料</button>
                  ) : (
                    <>
                      <button
                        className={
                          (isFollowing ? 'secondary' : 'primary') +
                          (mutual ? ' mutual-follow' : '')
                        }
                        onClick={toggleFollow}
                      >
                        {mutual ? (
                          <>
                            <span className="follow-default">互相关注</span>
                            <span className="follow-hover">取消关注</span>
                          </>
                        ) : isFollowing ? (
                          '已关注'
                        ) : (
                          '＋ 关注'
                        )}
                      </button>
                      <ChatButton ownerId={id} />
                    </>
                  )}
                </div>
              </div>
            </section>
            <section className="community-panel profile-journey">
              <div className="community-heading">
                <h2>时光长廊</h2>
                {own && (
                  <button onClick={() => setJourneyOpen(true)}>添加经历</button>
                )}
              </div>
              {posts.filter((p) => p.content.startsWith('【时光长廊】'))
                .length ? (
                <div className="journey-list">
                  {posts
                    .filter((p) => p.content.startsWith('【时光长廊】'))
                    .map((p) => {
                      const [heading, ...body] = p.content
                        .replace('【时光长廊】', '')
                        .split('\n');
                      const attachmentLine = body.find((line) =>
                        line.startsWith('【经历附件】'),
                      );
                      const [encodedName, attachmentUrl] = attachmentLine
                        ? attachmentLine.replace('【经历附件】', '').split('|')
                        : ['', ''];
                      const attachmentName = encodedName
                        ? decodeURIComponent(encodedName)
                        : '';
                      return (
                        <article key={p.id}>
                          <strong>{heading}</strong>
                          <p className="plain-content">
                            {body
                              .filter(
                                (line) => !line.startsWith('【经历附件】'),
                              )
                              .join('\n')}
                          </p>
                          {attachmentUrl && (
                            <a
                              className="journey-attachment"
                              href={attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FileText size={16} />
                              {attachmentName || '查看项目附件'}
                            </a>
                          )}
                        </article>
                      );
                    })}
                </div>
              ) : (
                <div className="profile-empty">
                  <p>暂未添加经历。这里会展示时间、项目、详情与相关图片。</p>
                </div>
              )}
            </section>
            <div className="profile-columns" id="profile-content">
              <section className="community-panel profile-activity">
                <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
                  <TabsList
                    variant="line"
                    className="profile-tab-list"
                    aria-label="个人主页内容"
                  >
                    {['动态', '项目'].map((t) => (
                      <TabsTrigger value={t} key={t}>
                        {t}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="动态">
                    {own && (
                      <div className="profile-composer">
                        <textarea
                          value={postDraft}
                          onChange={(e) => setPostDraft(e.target.value)}
                          placeholder="分享你的新想法、进展或正在寻找的合作…"
                          maxLength={2000}
                        />
                        <button
                          className="primary"
                          disabled={busy || !postDraft.trim()}
                          onClick={publishPost}
                        >
                          发布动态
                        </button>
                      </div>
                    )}
                    {posts.map((p) => (
                      <PostCard key={p.id} post={p} profile={profile} />
                    ))}
                    {!posts.length && (
                      <div className="profile-empty">
                        <h3>暂时没有动态</h3>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="项目">
                    <div className="profile-empty">
                      <h3>暂无项目记录</h3>
                      <p>项目模块将展示项目时间、项目名称和项目介绍。</p>
                    </div>
                  </TabsContent>
                </Tabs>
                <section className="profile-requirements">
                  <h2>正在寻找 / 发布的需求</h2>
                  <RequirementsFeed userId={id} />
                </section>
              </section>
              <aside className="profile-sidebar">
                <section className="community-panel">
                  <div className="community-heading">
                    <h2>关于我</h2>
                    {own && <button onClick={edit}>编辑</button>}
                  </div>
                  <p className="plain-content">{profile.bio || '暂未填写'}</p>
                  <ul className="profile-facts">
                    {profile.headline && (
                      <li>
                        <BriefcaseBusiness size={15} />
                        {profile.headline}
                      </li>
                    )}
                    {profile.city && (
                      <li>
                        <MapPin size={15} />
                        {profile.city}
                      </li>
                    )}
                  </ul>
                </section>
                <section className="community-panel profile-attachments">
                  <div className="community-heading">
                    <h2>作品 / 附件</h2>
                    {own && (
                      <label className="attachment-upload-button">
                        <Upload size={15} />
                        {attachmentBusy ? '上传中…' : '上传附件'}
                        <input
                          className="file-input-hidden"
                          type="file"
                          disabled={attachmentBusy}
                          onChange={async (e) => {
                            const input = e.currentTarget;
                            await storeProfileAttachment(input.files?.[0]);
                            input.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <div className="attachment-list">
                    {attachments.map((item) => (
                      <div className="attachment-row" key={item.id}>
                        <FileText size={17} />
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          title={item.file_name}
                        >
                          {item.file_name}
                        </a>
                        {own && (
                          <button
                            type="button"
                            disabled={attachmentBusy}
                            onClick={() => {
                              if (window.confirm('确定删除这个附件吗？'))
                                deleteProfileAttachment(item);
                            }}
                          >
                            删除
                          </button>
                        )}
                      </div>
                    ))}
                    {!attachments.length && (
                      <p className="attachment-empty">暂时还没有作品或附件。</p>
                    )}
                  </div>
                </section>
                <section className="community-panel">
                  <div className="community-heading">
                    <h2>个人标签</h2>
                    {own && <button onClick={edit}>编辑</button>}
                  </div>
                  <div className="profile-tags">
                    {skillList(profile.skills).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                    {!skillList(profile.skills).length && <p>暂未填写</p>}
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
      <footer className="wrap footer">
        <span>恣优 FlowIn</span>
        <span>让经验被看见，让工作更自由。</span>
      </footer>
      <Dialog
        open={editing}
        onOpenChange={(v) => {
          if (!busy) setEditing(v);
        }}
      >
        <DialogContent className="profile-edit-dialog">
          <DialogTitle>编辑个人资料</DialogTitle>
          <DialogDescription>
            公开资料会显示在你的主页、需求与动态中。
          </DialogDescription>
          <form onSubmit={save}>
            <label>
              上传头像
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadAvatar(e.target.files?.[0])}
              />
              <small>支持 JPG、PNG、WebP，最大 2MB。</small>
            </label>
            <h3>社交主页</h3>
            {[
              ['xiaohongshu_url', '小红书主页链接'],
              ['bilibili_url', 'B站主页链接'],
              ['jike_url', '即刻主页链接'],
              ['wechat_id', '微信号'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  value={String(draft[key as keyof typeof draft])}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <div className="wechat-qr-editor">
              <strong>微信二维码（选填）</strong>
              <label className="qr-upload-control">
                <Upload size={16} />
                {draft.wechat_qr_url ? '更换二维码' : '上传二维码图片'}
                <input
                  className="file-input-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    await uploadWechatQr(input.files?.[0]);
                    input.value = '';
                  }}
                />
              </label>
              {draft.wechat_qr_url && (
                <div className="qr-preview-wrap">
                  <img
                    className="qr-preview"
                    src={draft.wechat_qr_url}
                    alt="微信二维码预览"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, wechat_qr_url: '' })}
                  >
                    删除二维码
                  </button>
                </div>
              )}
              <small>支持 JPG、PNG、WEBP，最大 5MB。</small>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={draft.wechat_public}
                onChange={(e) =>
                  setDraft({ ...draft, wechat_public: e.target.checked })
                }
              />
              在主页公开我的微信
            </label>
            {[
              ['name', '昵称'],
              ['headline', '职业 / 一句话介绍'],
              ['city', '城市'],
              ['bio', '个人简介'],
              ['skills', '个人标签（用顿号分隔）'],
              ['avatar_url', '头像链接（HTTPS，选填）'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required={key === 'name'}
                  value={String(draft[key as keyof typeof draft])}
                  onChange={(e) =>
                    setDraft({ ...draft, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            {error && <p role="alert">{error}</p>}
            <div className="profile-form-actions">
              <button type="button" onClick={() => setEditing(false)}>
                取消
              </button>
              <button className="primary" disabled={busy}>
                {busy ? '保存中…' : '保存资料'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={journeyOpen} onOpenChange={setJourneyOpen}>
        <DialogContent>
          <DialogTitle>添加经历</DialogTitle>
          <DialogDescription>写下你引以为傲的一段经历。</DialogDescription>
          <form className="event-form" onSubmit={publishJourney}>
            <label>
              时间
              <input
                required
                value={journey.time}
                onChange={(e) =>
                  setJourney((v) => ({ ...v, time: e.target.value }))
                }
                placeholder="例如：2026.03 — 2026.06"
              />
            </label>
            <label>
              项目 / 经历名称
              <input
                required
                value={journey.project}
                onChange={(e) =>
                  setJourney((v) => ({ ...v, project: e.target.value }))
                }
              />
            </label>
            <label>
              详情
              <textarea
                required
                rows={5}
                value={journey.details}
                onChange={(e) =>
                  setJourney((v) => ({ ...v, details: e.target.value }))
                }
                placeholder="你做了什么、成果是什么？"
              />
            </label>
            <div className="journey-upload">
              <strong>项目附件（选填）</strong>
              <label className="qr-upload-control">
                <Upload size={16} />
                {journey.attachmentUrl ? '更换附件' : '上传项目附件'}
                <input
                  className="file-input-hidden"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    await uploadJourneyAttachment(input.files?.[0]);
                    input.value = '';
                  }}
                />
              </label>
              {journey.attachmentName && (
                <span className="upload-file-name">
                  <FileText size={15} /> {journey.attachmentName}
                </span>
              )}
              <small>支持 PDF、Word、PPT、Excel、TXT、ZIP，最大 20MB。</small>
            </div>
            {error && <p role="alert">{error}</p>}
            <button className="primary" disabled={busy}>
              {busy ? '保存中…' : '保存经历'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!followOpen}
        onOpenChange={(open) => {
          if (!open) setFollowOpen(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {followOpen === 'following' ? '关注' : '粉丝'}
          </DialogTitle>
          <DialogDescription>
            {followOpen === 'following' ? '正在关注的伙伴' : '关注你的伙伴'}
          </DialogDescription>
          <FollowList
            ids={
              followOpen === 'following'
                ? following.map((f) => f.following_id)
                : followers.map((f) => f.follower_id)
            }
          />
        </DialogContent>
      </Dialog>
      <Dialog open={wechatOpen} onOpenChange={setWechatOpen}>
        <DialogContent className="wechat-dialog">
          <DialogTitle>微信</DialogTitle>
          <DialogDescription>
            {own && !profile?.wechat_public
              ? '当前微信信息尚未对其他用户公开。'
              : '通过微信与这位伙伴联系。'}
          </DialogDescription>
          {profile?.wechat_id && (
            <p className="wechat-id">
              <span>微信号</span>
              <strong>{profile.wechat_id}</strong>
            </p>
          )}
          {profile?.wechat_qr_url && (
            <img
              className="wechat-qr-display"
              src={profile.wechat_qr_url}
              alt="微信二维码"
            />
          )}
        </DialogContent>
      </Dialog>
      {notice && (
        <div role="status" className="social-toast">
          {notice}
          <button onClick={() => setNotice('')} aria-label="关闭提示">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
